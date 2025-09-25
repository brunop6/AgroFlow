import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import mqtt, { MqttClient } from 'mqtt';
// A interface SensorInterface foi movida para este arquivo para simplificar,
// mas pode ficar em um arquivo separado como você tinha.
export interface SensorInterface {
  id: string;
  name?: string;
  culture?: string;
  isAssociated: boolean;
  humidity: number;
  timestamp: number;
}

// A interface SensorState herda de SensorInterface e adiciona campos de estado.
export interface SensorState extends SensorInterface {
  lastUpdate: number;
  status: 'online' | 'offline';
  lat?: number;
  lon?: number;
  isInArea?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private client: MqttClient;

  // Mapeia sensores pelo seu ID (endereço MAC)
  private sensors = new Map<string, SensorState>();

  // BehaviorSubject para emitir a lista atualizada de sensores para os componentes
  private sensorsSubject = new BehaviorSubject<SensorState[]>([]);

  // Limite de tempo (2 minutos) para considerar um sensor como offline
  private readonly OFFLINE_THRESHOLD = 2 * 60 * 1000;

  constructor() {
    this.connectToBroker();
    this.startOfflineWatcher();
  }

  private connectToBroker(): void {
    const brokerUrl = 'wss://test.mosquitto.org:8081/mqtt';
    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      console.log('Conectado ao broker MQTT');
      this.subscribeToTopics();
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        // **CORREÇÃO PRINCIPAL:** Espera 'id' no payload, não 'culture'
        const { id, humidity, timestamp } = data;

        // Validação básica para garantir que a mensagem tem o ID
        if (!id) {
          console.warn('Mensagem recebida sem ID, descartando:', data);
          return;
        }

        const existingSensor = this.sensors.get(id);

        if (existingSensor) {
          // Se o sensor já existe, atualiza suas informações
          existingSensor.humidity = humidity;
          existingSensor.timestamp = timestamp;
          existingSensor.status = 'online';
          existingSensor.lastUpdate = Date.now();
        } else {
          // Se é um sensor novo, cria um novo objeto SensorState com todos os campos
          const newSensor: SensorState = {
            id: id,
            humidity: humidity,
            timestamp: timestamp,
            isAssociated: false, // **CORREÇÃO:** Define um valor padrão
            status: 'online',
            lastUpdate: Date.now(),
            // Outros campos como 'name' e 'culture' podem ser adicionados depois
          };
          this.sensors.set(id, newSensor);
          console.log(`Novo sensor detectado: ${id}`);
        }

        // Emite a nova lista de sensores para todos os inscritos
        this.sensorsSubject.next(Array.from(this.sensors.values()));

      } catch (e) {
        console.error('Erro ao processar mensagem MQTT:', e);
      }
    });

    this.client.on('error', (error) => {
      console.error('Erro na conexão com o broker MQTT:', error);
    });
  }

  /**
   * Verifica periodicamente quais sensores ficaram offline.
   */
  private startOfflineWatcher(): void {
    setInterval(() => {
      const now = Date.now();
      let listHasChanged = false;

      this.sensors.forEach((sensor, id) => {
        const timeSinceLastUpdate = now - sensor.lastUpdate;

        if (sensor.status === 'online' && timeSinceLastUpdate > this.OFFLINE_THRESHOLD) {
          sensor.status = 'offline';
          listHasChanged = true;
          console.warn(`Sensor '${id}' ficou offline.`);
        }
      });

      if (listHasChanged) {
        this.sensorsSubject.next(Array.from(this.sensors.values()));
      }
    }, 30000); // Executa a cada 30 segundos
  }

  private subscribeToTopics(): void {
    const topic = 'sensors/humidity';
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Erro ao se inscrever no tópico ${topic}:`, err);
      } else {
        console.log(`Inscrito com sucesso no tópico: ${topic}`);
      }
    });
  }

  /**
   * Retorna um Observable que emite a lista de sensores sempre que ela for atualizada.
   */
  public getSensorList(): Observable<SensorState[]> {
    return this.sensorsSubject.asObservable();
  }

  /**
   * Publica um comando genérico para um sensor específico.
   */
  public publishCommand(sensorId: string, command: string): void {
    const topic = `sensors/${sensorId}/command`;
    this.client.publish(topic, command, (err) => {
      if (err) {
        console.error(`Erro ao publicar comando '${command}' para '${sensorId}':`, err);
      } else {
        console.log(`Comando '${command}' enviado para '${sensorId}'`);
      }
    });
  }

  public publishSimulatedData(id: string, humidity: number): void {
    const topic = 'sensors/humidity';
    const timestamp = Date.now();
    const message = JSON.stringify({ id, humidity, timestamp });

    this.client.publish(topic, message, (err) => {
      if (err) {
        console.error(`Erro ao publicar mensagem simulada para '${id}':`, err);
      } else {
        console.log(`Mensagem simulada para '${id}' publicada com sucesso:`, message);
      }
    });
  }

  /**
   * Envia um comando de reset e remove o sensor da lista local.
   */
  public requestSensorReset(sensorId: string): void {
    this.publishCommand(sensorId, 'RESET');

    if (this.sensors.has(sensorId)) {
      this.sensors.delete(sensorId);
      this.sensorsSubject.next(Array.from(this.sensors.values()));
      console.log(`Sensor '${sensorId}' removido da lista local.`);
    }
  }

  /**
   * Atualiza os metadados de um sensor existente (nome, cultura, etc.).
   * Em uma aplicação real, isso também salvaria os dados em um banco de dados.
   */
  public updateSensorMetadata(sensorId: string, metadata: { name: string, culture: string, lat: number, lon: number }): void {
    const sensorToUpdate = this.sensors.get(sensorId);

    if (sensorToUpdate) {
      // Atualiza os campos do sensor existente
      sensorToUpdate.name = metadata.name;
      sensorToUpdate.culture = metadata.culture;
      sensorToUpdate.lat = metadata.lat;
      sensorToUpdate.lon = metadata.lon;
      sensorToUpdate.isAssociated = true;

      console.log(`Sensor '${sensorId}' atualizado com novos metadados.`);

      this.sensorsSubject.next(Array.from(this.sensors.values()));
    } else {
      console.error(`Tentativa de atualizar um sensor que não existe: ${sensorId}`);
    }
  }
}
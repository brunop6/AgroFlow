import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import mqtt, { MqttClient } from 'mqtt';
import { SensorInterface } from '../interfaces/sensor-interface';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private client: MqttClient;
  private humiditySubject: Subject<SensorInterface> = new Subject();

  constructor() {
    this.connectToBroker();
  }

  private connectToBroker(): void {
    const brokerUrl = 'wss://test.mosquitto.org:8081/mqtt'; // URL do broker MQTT com a porta correta para WebSocket
    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      console.log('Conectado ao broker MQTT');
      this.subscribeToTopics();
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      console.log(`Mensagem recebida no tópico ${topic}: ${message.toString()}`);
      const data = JSON.parse(message.toString());
      const { culture, humidity, timestamp } = data;
      this.humiditySubject.next({ culture, humidity, timestamp });
    });

    this.client.on('error', (error) => {
      console.error('Erro na conexão com o broker MQTT:', error);
    });
  }

  private subscribeToTopics(): void {
    const topic = 'sensors/humidity'; // Tópico único para todas as mensagens
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Erro ao se inscrever no tópico ${topic}:`, err);
      } else {
        console.log(`Inscrito no tópico ${topic}`);
      }
    });
  }

  public getHumidityData(): Observable<SensorInterface> {
    return this.humiditySubject.asObservable();
  }

  public publishMessage(culture: string, humidity: number, timestamp: number): void {
    const topic = 'sensors/humidity';
    const message = JSON.stringify({ culture, humidity, timestamp });

    this.client.publish(topic, message, (err) => {
      if (err) {
        console.error('Erro ao publicar a mensagem:', err);
      } else {
        console.log('Mensagem publicada com sucesso');
      }
    });
  }
}
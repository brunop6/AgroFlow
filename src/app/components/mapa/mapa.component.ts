import { Component, AfterViewInit, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { SensorService, SensorState } from 'src/app/shared/services/sensor.service';
import { WeatherService } from 'src/app/shared/services/weather.service';

interface CultureStat {
  name: string;
  sensors: SensorState[];
  avgHumidity: number;
  status: 'ok' | 'alert';
  minMoisture: number; // <--- ADICIONE ESTA LINHA
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit, AfterViewInit {
  private map: L.Map;

  // Camadas (Layers)
  private baseMaps: any;
  private overlayMaps: any;
  private areasLayer: L.FeatureGroup;   // Camada de Áreas (Polígonos)
  private sensorsLayer: L.LayerGroup;   // Camada de Sensores (Marcadores)

  public cultureStats: CultureStat[] = [];
  public sensors: SensorState[] = [];

  constructor(
    private sensorService: SensorService,
    private weatherService: WeatherService
  ) { }

  ngOnInit(): void {
    // Inscreve-se nos dados e atualiza o mapa
    this.sensorService.getSensorList().subscribe(data => {
      this.sensors = data.filter(s => s.isAssociated && s.lat && s.lon);
      this.calculateCultureStats();
      this.updateSensorMarkers(); // Atualiza apenas os pinos dos sensores
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    // 1. Recupera localização
    let currentLoc = this.weatherService.location;
    if (!currentLoc) {
      const savedLocation = localStorage.getItem('location');
      if (savedLocation) {
        currentLoc = JSON.parse(savedLocation);
        this.weatherService.location = currentLoc;
      }
    }
    const initialLat = currentLoc?.lat ?? -22.412833;
    const initialLon = currentLoc?.lon ?? -45.449754;

    // 2. Define Mapas Base (Padrão e Satélite/Alternativo)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'AgroFlow | OpenStreetMap',
      maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    });

    // 3. Inicializa Camadas de Sobreposição (Overlays)
    this.areasLayer = new L.FeatureGroup();
    this.sensorsLayer = new L.LayerGroup();

    // 4. Inicializa o Mapa com as camadas padrão
    this.map = L.map('full-map', {
      center: [initialLat, initialLon],
      zoom: 15,
      layers: [osmLayer, this.areasLayer, this.sensorsLayer] // Camadas ativas no início
    });

    // 5. Configura o Controle de Camadas (Canto Superior Direito)
    this.baseMaps = {
      "Mapa Padrão": osmLayer,
      "Satélite (Esri)": satelliteLayer
    };

    this.overlayMaps = {
      "Áreas de Cultivo": this.areasLayer,
      "Sensores IoT": this.sensorsLayer
    };

    L.control.layers(this.baseMaps, this.overlayMaps).addTo(this.map);

    // 6. Configura Ferramentas de Desenho (Vinculado apenas à camada de áreas)
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: this.areasLayer },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false, // Desativado para evitar bug do Leaflet Draw
          shapeOptions: { color: '#2e7d32' }
        },
        marker: false,
        circle: false,
        polyline: false,
        rectangle: {
          shapeOptions: {
            color: '#2e7d32',
            interactive: true
          }
        }
      }
    });
    this.map.addControl(drawControl);

    // 7. Carrega e Salva Áreas
    this.loadSavedAreas();

    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      this.areasLayer.addLayer(layer);
      this.saveAreas();
    });

    this.map.on(L.Draw.Event.EDITED, () => this.saveAreas());
    this.map.on(L.Draw.Event.DELETED, () => this.saveAreas());
  }

  private updateSensorMarkers(): void {
    if (!this.map || !this.sensorsLayer) return;

    // Limpa apenas a camada de sensores, mantendo as áreas intactas
    this.sensorsLayer.clearLayers();

    this.sensors.forEach(sensor => {
      // Define cor baseada no status
      const isCritical = sensor.humidity < 30;
      const isOffline = sensor.status === 'offline';

      let iconColor = '#2e7d32'; // Verde (Normal)
      let pulseClass = '';

      if (isOffline) {
        iconColor = '#9e9e9e'; // Cinza
      } else if (isCritical) {
        iconColor = '#ef4444'; // Vermelho
        pulseClass = 'pulse-alert'; // Classe para animação de pulso
      }

      // Cria ícone HTML customizado (Pin Moderno)
      const customIcon = L.divIcon({
        className: 'custom-sensor-pin',
        html: `
          <div class="pin-inner ${pulseClass}" style="background-color: ${iconColor};">
            <span class="material-icons" style="font-size: 14px; color: white;">sensors</span>
          </div>
          <div class="pin-stem" style="background-color: ${iconColor};"></div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -45]
      });

      const marker = L.marker([sensor.lat!, sensor.lon!], { icon: customIcon });

      // Popup Rico em HTML
      const popupContent = `
        <div class="map-popup-card">
          <div class="popup-header" style="background-color: ${iconColor}">
            <strong>${sensor.name || 'Sensor Sem Nome'}</strong>
          </div>
          <div class="popup-body">
            <p class="culture-tag">${sensor.culture}</p>
            <div class="metric-row">
              <span class="label">Umidade Atual:</span>
              <span class="value" style="color: ${iconColor}">${sensor.humidity.toFixed(1)}%</span>
            </div>
             <div class="metric-row">
              <span class="label">Status:</span>
              <span class="value">${isOffline ? 'Offline' : 'Online'}</span>
            </div>
            <div class="popup-footer">
              <small>Última leitura: ${new Date(sensor.timestamp).toLocaleTimeString()}</small>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Adiciona o marcador à camada de sensores
      this.sensorsLayer.addLayer(marker);
    });
  }

  private calculateCultureStats(): void {
    const groups: { [key: string]: SensorState[] } = {};
    this.sensors.forEach(s => {
      if (!groups[s.culture]) groups[s.culture] = [];
      groups[s.culture].push(s);
    });

    this.cultureStats = Object.keys(groups).map(culture => {
      const sensors = groups[culture];
      const avg = sensors.reduce((acc, curr) => acc + curr.humidity, 0) / sensors.length;

      const limiteUmidade = 30; // Define o limite crítico (pode vir de config depois)

      return {
        name: culture,
        sensors: sensors,
        avgHumidity: avg,
        minMoisture: limiteUmidade, // <--- ADICIONE ESTA LINHA
        status: avg < limiteUmidade ? 'alert' : 'ok'
      };
    });
  }

  private saveAreas(): void {
    const data = this.areasLayer.toGeoJSON();
    localStorage.setItem('agroflow_areas', JSON.stringify(data));
  }

  private loadSavedAreas(): void {
    const saved = localStorage.getItem('agroflow_areas');
    if (saved) {
      const geoJsonData = JSON.parse(saved);
      L.geoJSON(geoJsonData, {
        onEachFeature: (feature, layer) => {
          this.areasLayer.addLayer(layer);
        },
        style: { color: '#2e7d32', fillOpacity: 0.2, weight: 2 }
      });
    }
  }

  public flyToCulture(sensor: SensorState): void {
    if (sensor.lat && sensor.lon) {
      this.map.flyTo([sensor.lat, sensor.lon], 17, { duration: 1.5 });
      // Opcional: abrir o popup do sensor após voar
      // Isso exigiria mapear os marcadores para abri-los programaticamente
    }
  }
}
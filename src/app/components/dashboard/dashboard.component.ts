import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import * as L from 'leaflet';
import 'leaflet-draw';
import { MatDialog } from '@angular/material/dialog';
import { ConfigDialogComponent } from './config-dialog/config-dialog.component';
import { WeatherService } from 'src/app/shared/services/weather.service';
import { IrrigationService } from 'src/app/shared/services/irrigation.service';
import { SensorService, SensorState } from 'src/app/shared/services/sensor.service';
import * as turf from '@turf/turf';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private map: L.Map;
  private marker: L.Marker;
  private sensorLineChart: Chart;
  private cultureColors: { [culture: string]: { borderColor: string, backgroundColor: string } } = {};
  private sensorDataHistory: { [id: string]: { x: number, y: number }[] } = {};

  protected searchQuery: string = '';
  protected filteredWeatherData: any = [];
  protected totalSavings: number = 0;
  protected irrigationResults: boolean = false;
  protected sensorData: SensorState[] = [];
  protected drawnArea: L.Polygon | null = null;
  private drawnAreaGeoJSON: any = null;

  public get sensorsInAreaCount(): number {
    if (!this.sensorData) {
      return 0;
    }
    return this.sensorData.filter(s => s.isInArea).length;
  }

  constructor(
    protected weatherService: WeatherService,
    protected irrigationService: IrrigationService,
    protected sensorService: SensorService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    private router: Router
  ) {
    const savedLocation = localStorage.getItem('location');
    if (savedLocation) {
      this.weatherService.location = JSON.parse(savedLocation);
    } else {
      this.weatherService.location = {
        lat: -22.412833,
        lon: -45.449754,
        address: 'Universidade Federal de Itajubá, 1301, Avenida BPS, Nossa Senhora da Agonia, Itajubá, Região Geográfica Imediata de Itajubá, Região Geográfica Intermediária de Pouso Alegre, Minas Gerais, Região Sudeste, 37500-224, Brasil'
      }
    }
  }

  ngOnInit(): void {
    this.sensorService.getSensorList().subscribe((data: SensorState[]) => {
      this.sensorData = data.filter(s => s.isAssociated && s.status === 'online');

      data.forEach(sensor => {
        if (sensor.isAssociated && sensor.status === 'online') {
          if (!this.sensorDataHistory[sensor.id]) {
            this.sensorDataHistory[sensor.id] = [];
          }
          this.sensorDataHistory[sensor.id].push({
            x: sensor.timestamp,
            y: sensor.humidity
          });

          const maxHistoryPoints = 100;
          if (this.sensorDataHistory[sensor.id].length > maxHistoryPoints) {
            this.sensorDataHistory[sensor.id].shift();
          }
        }
      });

      this.updateSensorLineChart();
    });

    const savedWeatherData = localStorage.getItem('weatherData');
    if (savedWeatherData) {
      this.weatherService.weatherData = JSON.parse(savedWeatherData);
      this.filteredWeatherData = this.weatherService.extractRainData(this.weatherService.weatherData.daily);
      this.addDayData(this.filteredWeatherData);
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.createCharts();
    this.initSensorLineChart();
  }

  private initMap(): void {
    this.map = L.map('map').setView([this.weatherService.location.lat, this.weatherService.location.lon], 15);
    reverseGeocode(this.weatherService.location.lat, this.weatherService.location.lon).then((data) => {
      this.weatherService.location.address = data;
    }).catch((error) => {
      console.error("Erro ao acessar Nominatim:", error);
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.marker = L.marker([this.weatherService.location.lat, this.weatherService.location.lon], { draggable: true }).addTo(this.map);

    this.map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.weatherService.location.lat = lat;
      this.weatherService.location.lon = lng;
      reverseGeocode(lat, lng).then((data) => {
        this.weatherService.location.address = data;
        this.getWeatherData(lat, lng);
        localStorage.setItem('location', JSON.stringify(this.weatherService.location));
      }).catch((error) => {
        console.error("Erro ao acessar Nominatim:", error);
      });
    });

    const drawnItems = new L.FeatureGroup();
    this.map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems
      },
      draw: {
        polygon: {
          allowIntersection: true,
          showArea: true,
          shapeOptions: {
            color: 'red',
            clickable: true,
            fillOpacity: 0.5,
            fillColor: 'red'
          },
          maxPoints: 10,
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false
      }
    });
    this.map.addControl(drawControl);
    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      this.drawnArea = layer;
      this.drawnAreaGeoJSON = layer.toGeoJSON();

      console.log("Área desenhada:", this.drawnAreaGeoJSON);

      this.associateSensorsToArea();
    });

    this.map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer(layer => {
        this.drawnArea = layer;
        this.drawnAreaGeoJSON = layer.toGeoJSON();
        this.associateSensorsToArea();
      });
    });

    async function reverseGeocode(lat: number, lng: number): Promise<string> {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Erro ao acessar Nominatim');
        }
        const data = await response.json();
        if (data.display_name) {
          return data.display_name;
        } else {
          console.log("Nenhum endereço encontrado.");
          return null;
        }
      } catch (error) {
        console.error("Erro ao acessar Nominatim:", error);
        return null;
      }
    }
  }

  private associateSensorsToArea(): void {
    if (!this.drawnAreaGeoJSON || this.sensorData.length === 0) {
      return;
    }

    let sensorsInAreaCount = 0;
    this.sensorData.forEach(sensor => {
      if (sensor.lat && sensor.lon) {
        const sensorPoint = turf.point([sensor.lon, sensor.lat]);

        const isInside = turf.booleanPointInPolygon(sensorPoint, this.drawnAreaGeoJSON);

        (sensor as any).isInArea = isInside;

        if (isInside) {
          sensorsInAreaCount++;
          console.log(`Sensor '${sensor.name || sensor.id}' ESTÁ DENTRO da área.`);
        }
      } else {
        (sensor as any).isInArea = false;
      }
    });

    console.log(`${sensorsInAreaCount} sensor(es) encontrado(s) na área selecionada.`);
    this.cdr.detectChanges();
  }

  async getWeatherData(lat: number, lon: number): Promise<void> {
    this.weatherService.getWeatherData(lat, lon).subscribe(
      (data: any) => {
        console.log('Weather data:', data);
        this.weatherService.weatherData = data;
        data.daily.map((day, index) => {
          const timestamp = day.dt * 1000;
          data.daily[index].Ra = this.weatherService.calculateRa(lat, timestamp);
        })
        this.filteredWeatherData = this.weatherService.extractRainData(data.daily);
        this.addDayData(this.filteredWeatherData);
        localStorage.setItem('weatherData', JSON.stringify(this.weatherService.weatherData));
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching weather data:', error);
        if (error.error instanceof ErrorEvent) {
          console.error('Client-side error:', error.error.message);
        } else {
          console.error(`Server-side error: ${error.status} - ${error.message}`);
        }
      }
    );
  }

  async searchAddress(): Promise<void> {
    if (!this.searchQuery) {
      return;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}`;
    const response = await fetch(url);
    const results = await response.json();
    if (results.length > 0) {
      const result = results[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      this.map.setView([lat, lon], 13);
      this.marker.setLatLng([lat, lon]);
      this.weatherService.location.lat = lat;
      this.weatherService.location.lon = lon;
      this.weatherService.location.address = result.display_name
      this.getWeatherData(lat, lon);
      localStorage.setItem('location', JSON.stringify(this.weatherService.location));
    } else {
      console.error("Endereço não encontrado");
    }
  }

  private createCharts(): void { }

  private addDayData(filteredWeatherData: any[]): void {
    const container = document.querySelector("#prev-container");
    if (!container) return;
    container.innerHTML = "";
    filteredWeatherData.map((day, index) => {
      if (index < 8) {
        const divDay = document.createElement("div") as HTMLDivElement;
        divDay.classList.add('forecast-item');
        divDay.innerHTML = `
          <b>${day.date}</b>
          <p>Temp.: ${day.temp}°C</p>
          <p>Chuva: ${day.probability}% (${day.volume} mm)</p>
          <p>Umidade: ${day.humidity}%</p>
          <p>Ra: ${day.Ra} MJ/m²/dia</p>
        `;
        container.appendChild(divDay);
      }
    });
  }

  goToSensorMessage(): void {
    this.router.navigate(['/sensor-message']);
  }

  private initSensorLineChart(): void {
    const ctx = document.getElementById('sensorLineChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.sensorLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute'
            },
            title: {
              display: true,
              text: 'Tempo'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Umidade (%)'
            },
            min: 0,
            max: 100
          }
        }
      }
    });
  }

  private updateSensorLineChart(): void {
    if (!this.sensorLineChart) return;

    const sensorsByCulture: { [culture: string]: string[] } = {};
    this.sensorData.forEach(sensor => {
      if (!sensorsByCulture[sensor.culture]) {
        sensorsByCulture[sensor.culture] = [];
      }
      sensorsByCulture[sensor.culture].push(sensor.id);
    });

    const datasets = Object.keys(sensorsByCulture).map(culture => {
      let combinedData = [];
      sensorsByCulture[culture].forEach(sensorId => {
        combinedData = combinedData.concat(this.sensorDataHistory[sensorId] || []);
      });

      combinedData.sort((a, b) => a.x - b.x);

      if (!this.cultureColors[culture]) {
        this.cultureColors[culture] = {
          borderColor: this.getRandomColor(),
          backgroundColor: this.getRandomColor(0.2)
        };
      }

      return {
        label: `Umidade (${culture})`,
        data: combinedData,
        borderColor: this.cultureColors[culture].borderColor,
        backgroundColor: this.cultureColors[culture].backgroundColor,
        fill: true,
      };
    });

    this.sensorLineChart.data.datasets = datasets;
    this.sensorLineChart.update();
  }

  private groupSensorDataByCulture(): { [culture: string]: SensorState[] } {
    return this.sensorData.reduce((acc, data) => {
      if (!acc[data.culture]) {
        acc[data.culture] = [];
      }
      acc[data.culture].push(data);
      return acc;
    }, {});
  }

  private getRandomColor(alpha: number = 1): string {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  protected calculateIrrigation(): void {
    if (this.irrigationService.irrigationData.status === 'empty') {
      this.irrigationResults = false;
      alert('Por favor, configure o sistema de irrigação antes de calcular a irrigação.');
      return;
    }
    this.irrigationService.irrigationData.data = [];
    this.weatherService.weatherData.daily.forEach((day, index) => {
      const adjustedKc = this.irrigationService.calculateAdjustedKc(
        this.irrigationService.irrigationData.config.Kc,
        day.wind_speed,
        day.humidity,
        this.irrigationService.irrigationData.config.maxHeight
      );
      const ETo = this.irrigationService.calculateETo(
        day.temp.max,
        day.temp.min,
        day.temp.day,
        day.Ra
      );
      const totalIrrigation = this.irrigationService.calculateIrrigationRequirement(
        ETo,
        adjustedKc,
        this.irrigationService.irrigationData.config.Ef
      );
      const effectiveRain = this.irrigationService.calculateEffectiveRain(
        (day.rain || 0),
        this.irrigationService.irrigationData.config.Ef
      );
      const finalIrrigation = (totalIrrigation - effectiveRain) < 0 ? 0 : totalIrrigation - effectiveRain;
      this.irrigationService.irrigationData.data.push({
        adjustedKc: Number(adjustedKc.toFixed(2)),
        ETo: Number(ETo.toFixed(2)),
        effectiveRain: Number(effectiveRain.toFixed(2)),
        finalIrrigation: Number(finalIrrigation.toFixed(2)),
        totalIrrigation: Number(totalIrrigation.toFixed(2))
      });
    });
    this.irrigationResults = true;
    this.totalSavings = this.irrigationService.irrigationData.data.reduce((acc, day) => acc + (day.totalIrrigation - day.finalIrrigation), 0);
    this.cdr.detectChanges();
    console.log('Configuração:', this.irrigationService.irrigationData.config);
    console.log('Irrigação calculada:', this.irrigationService.irrigationData.data);
  }
  // Adicione estes métodos ao seu componente TypeScript
  getTotalIrrigation(): number {
    if (!this.irrigationService.irrigationData?.data) return 0;
    return this.irrigationService.irrigationData.data.reduce(
      (total, item) => total + item.finalIrrigation, 0
    );
  }

  getDayName(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  getIrrigationStatus(irrigation: number): string {
    if (irrigation > 10) return 'high';
    if (irrigation > 5) return 'medium';
    return 'low';
  }

  getIrrigationStatusText(irrigation: number): string {
    if (irrigation > 10) return 'Alta Necessidade';
    if (irrigation > 5) return 'Média Necessidade';
    return 'Baixa Necessidade';
  }
}
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import * as L from 'leaflet';
import 'leaflet-draw';
import { WeatherService } from 'src/app/shared/services/weather.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfigDialogComponent } from './config-dialog/config-dialog.component';
import { IrrigationService } from 'src/app/shared/services/irrigation.service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private map: L.Map;
  private marker: L.Marker;

  private lineChart: Chart;

  protected searchQuery: string = '';
  protected filteredWeatherData: any = [];
  protected totalSavings: number = 0;
  protected irrigationResults: boolean = false;

  constructor(
    protected weatherService: WeatherService,
    protected irrigationService: IrrigationService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
  ) {
    // Busca localização na local storage
    const savedLocation = localStorage.getItem('location');

    if (savedLocation) {
      this.weatherService.location = JSON.parse(savedLocation);
    } else {
      // Localização padrão
      this.weatherService.location = {
        lat: -22.412833,
        lon: -45.449754,
        address: 'Universidade Federal de Itajubá, 1301, Avenida BPS, Nossa Senhora da Agonia, Itajubá, Região Geográfica Imediata de Itajubá, Região Geográfica Intermediária de Pouso Alegre, Minas Gerais, Região Sudeste, 37500-224, Brasil'
      }
    }
  }

  ngOnInit(): void {
    //Busca os dados do clima na local storage
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
  }

  // Inicializa o mapa
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

    // Adiciona um evento de clique no mapa
    this.map.on("click", (e) => {
      const { lat, lng } = e.latlng; // Pega a latitude e longitude
      this.marker.setLatLng([lat, lng]); // Move o marcador para o local clicado

      // Atualiza as variáveis de latitude e longitude
      this.weatherService.location.lat = lat;
      this.weatherService.location.lon = lng;

      reverseGeocode(lat, lng).then((data) => {
        this.weatherService.location.address = data;

        // Chama a função para obter os dados do clima
        this.getWeatherData(lat, lng);

        localStorage.setItem('location', JSON.stringify(this.weatherService.location));
      }).catch((error) => {
        console.error("Erro ao acessar Nominatim:", error);
      });

      // Salva a localização no local storage
    });

    // Adiciona a funcionalidade de desenho
    const drawnItems = new L.FeatureGroup();
    this.map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems
      },
      draw: {
        polygon: {
          allowIntersection: true, // Não permite interseção de polígonos
          showArea: true, // Mostra a área do polígono
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

    this.map.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
    });

    // Função para obter o endereço usando Nominatim
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

  /**
   * Função para obter os dados do clima
   * @param lat 
   * @param lon 
   */
  async getWeatherData(lat: number, lon: number): Promise<void> {
    this.weatherService.getWeatherData(lat, lon).subscribe(
      data => {
        console.log('Weather data:', data);
        this.weatherService.weatherData = data;

        // Calcula a radiação extraterrestre (Ra) em MJ/m²/dia
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
          // Erro do lado do cliente
          console.error('Client-side error:', error.error.message);
        } else {
          // Erro do lado do servidor
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

      // Chama a função para obter os dados do clima
      this.getWeatherData(lat, lon);

      localStorage.setItem('location', JSON.stringify(this.weatherService.location));
    } else {
      console.error("Endereço não encontrado");
    }
  }

  private createCharts(): void {
    // Gráfico de recursos/cultura
    new Chart("pieChart", {
      type: 'pie', // Tipo do gráfico
      data: {
        labels: ['Soja', 'Milho', 'Mandioca', 'Feijão'], // Rótulos do gráfico
        datasets: [{
          data: [30, 25, 20, 25], // Dados de exemplo (percentuais ou proporções)
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50'], // Cores das fatias
          hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50'], // Cores ao passar o mouse
        }]
      },
      options: {
        responsive: true, // Adapta ao tamanho do container
        plugins: {
          legend: {
            display: true, // Exibe a legenda
            position: 'top' // Posição da legenda
          },
          tooltip: {
            enabled: true // Habilita os tooltips ao passar o mouse
          }
        }
      }
    });

    //Gráfico de recursos/dia
    const estimatedConsumptionData = [];
    const consumptionData = [];
    const effectiveRain = [];
    const days = this.filteredWeatherData.map(day => day.date);

    this.lineChart = new Chart("lineChart", {
      type: 'line',
      data: {
        labels: days, // Rótulos do eixo X (dias)
        datasets: [
          {
            label: 'Consumo Diário (mm)',
            data: consumptionData, // Dados do eixo Y (consumo)
            borderColor: '#008000', // Cor da linha
            backgroundColor: 'rgba(0, 128, 0, 0.2)', // Área preenchida abaixo da linha
            borderWidth: 2, // Largura da linha
            tension: 0.4 // Curvatura da linha
          },
          {
            label: 'Consumo Estimado (mm)',
            data: estimatedConsumptionData, // Dados do eixo Y (consumo estimado)
            borderColor: '#FF6384', // Cor da linha
            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Área preenchida abaixo da linha
            borderWidth: 2, // Largura da linha
            tension: 0.4 // Curvatura da linha
          },
          {
            label: 'Volume chuva (mm)',
            data: effectiveRain, // Dados do eixo Y (chuva eficaz)
            borderColor: '#36A2EB', // Cor da linha
            backgroundColor: 'rgba(54, 162, 235, 0.2)', // Área preenchida abaixo da linha
            borderWidth: 2, // Largura da linha
            tension: 0.4 // Curvatura da linha
          }
        ]
      },
      options: {
        responsive: true, // Gráfico responsivo
        plugins: {
          legend: {
            display: true,
            position: 'top' // Posição da legenda
          },
          tooltip: {
            enabled: true // Exibe tooltips ao passar o mouse
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Dias',
              font: { size: 14 }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Volume água (mm)',
              font: { size: 14 }
            },
          }
        }
      }
    });
  }

  /**
   * Função para adicionar os dados de chuva no container
   * @param filteredWeatherData 
   */
  private addDayData(filteredWeatherData: any[]): void {
    const container = document.querySelector("#prev-container");
    container.innerHTML = "";

    filteredWeatherData.map((day, index) => {
      if (index < 8) {
        const pProb = document.createElement("p") as HTMLParagraphElement;
        const pVol = document.createElement("p") as HTMLParagraphElement;
        const bDay = document.createElement("b") as HTMLParagraphElement;
        const pRa = document.createElement("p") as HTMLParagraphElement;
        const pHumidity = document.createElement("p") as HTMLParagraphElement;
        const pTemp = document.createElement("p") as HTMLParagraphElement;
        const divDay = document.createElement("div") as HTMLDivElement;

        pRa.textContent = `Ra: ${day.Ra} MJ/m²/dia`;
        pHumidity.textContent = `Umidade: ${day.humidity}%`;
        pTemp.textContent = `Temp.: ${day.temp}°C`;
        pProb.textContent = `Chuva: ${day.probability}%`;
        pVol.textContent = `Vol.: ${day.volume} mm³`;
        bDay.textContent = day.date;

        pRa.style.cssText = "text-align: left; margin: 5px 0";
        pHumidity.style.cssText = "text-align: left; margin: 5px 0";
        pTemp.style.cssText = "text-align: left; margin: 5px 0";
        pProb.style.cssText = "text-align: left; margin: 5px 0";
        pVol.style.cssText = "text-align: left; margin: 5px 0";
        bDay.style.cssText = "text-align: left; margin: 5px 0";

        divDay.style.cssText = "background-color: #fff;padding: 20px;border-radius: 8px;box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);width: 250px;display: flex;flex-direction: column;justify-items: center;align-items: left; gap: 10px;";

        divDay.appendChild(bDay);
        divDay.appendChild(pTemp);
        divDay.appendChild(pProb);
        divDay.appendChild(pVol);
        divDay.appendChild(pHumidity);
        divDay.appendChild(pRa);

        container.appendChild(divDay);
      }
    })
  }

  protected openConfigDialog(): void {
    if (!this.weatherService.weatherData) {
      alert('Por favor, selecione uma localização no mapa antes de configurar o sistema de irrigação.');
      return;
    }
    const dialogRef = this.dialog.open(ConfigDialogComponent, {
      width: '700px',
      data: this.irrigationService.irrigationData.config
    });

    dialogRef.afterClosed().subscribe(result => {
      // Lógica adicional após o fechamento do diálogo, se necessário
    });
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

    if (this.lineChart) {
      this.lineChart.data.datasets[0].data = this.irrigationService.irrigationData.data.map(day => day.finalIrrigation);
      this.lineChart.data.datasets[1].data = this.irrigationService.irrigationData.data.map(day => day.totalIrrigation);
      this.lineChart.data.datasets[2].data = this.irrigationService.irrigationData.data.map(day => day.effectiveRain);
      this.lineChart.update();
    }

    this.totalSavings = this.irrigationService.irrigationData.data.reduce((acc, day) => acc + (day.totalIrrigation - day.finalIrrigation), 0);
    this.cdr.detectChanges();

    console.log('Configuração:', this.irrigationService.irrigationData.config);
    console.log('Irrigação calculada:', this.irrigationService.irrigationData.data);
  }
}



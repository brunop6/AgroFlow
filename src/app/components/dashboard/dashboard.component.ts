import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import * as L from 'leaflet';
import 'leaflet-draw';
import { WeatherService } from 'src/app/shared/services/weather.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private lat: number = -22.412833;
  private lon: number = -45.449754;
  private map: L.Map;
  private marker: L.Marker;

  protected address: string;
  protected searchQuery: string = '';
  protected weatherData: any = {
    alerts: [],
    current: {}
  };
  protected filteredWeatherData: any;
  protected totalSavings: number;

  constructor(private weatherService: WeatherService) { }

  async ngOnInit(): Promise<void> {
    this.initMap();
  }

  ngAfterViewInit(): void {
    this.createCharts();
  }

  private initMap(): void {
    //Configuração do mapa
    this.map = L.map('map').setView([this.lat, this.lon], 13);

    reverseGeocode(this.lat, this.lon).then((data) => {
      this.address = data;
    }).catch((error) => {
      console.error("Erro ao acessar Nominatim:", error);
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.marker = L.marker([-22.412833, -45.449754], { draggable: true }).addTo(this.map);

    // Adiciona um evento de clique no mapa
    this.map.on("click", (e) => {
      const { lat, lng } = e.latlng; // Pega a latitude e longitude
      this.marker.setLatLng([lat, lng]); // Move o marcador para o local clicado

      // Atualiza as variáveis de latitude e longitude
      this.lat = lat;
      this.lon = lng;

      reverseGeocode(lat, lng).then((data) => {
        this.address = data;

        // Chama a função para obter os dados do clima
        this.getWeatherData(lat, lng);
      }).catch((error) => {
        console.error("Erro ao acessar Nominatim:", error);
      });
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

  // Função para obter os dados do clima
  async getWeatherData(lat: number, lon: number): Promise<void> {
    this.weatherService.getWeatherData(lat, lon).subscribe(
      data => {
        console.log('Weather data:', data);
        this.weatherData = data;

        this.filteredWeatherData = this.weatherService.extractRainData(data.daily);
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

      this.lat = lat;
      this.lon = lon;
      this.address = result.display_name;

      // Chama a função para obter os dados do clima
      this.getWeatherData(lat, lon);
    } else {
      console.error("Endereço não encontrado");
    }
  }

  createCharts() {
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
    // Simulação de dados: consumo diário de recursos hídricos (em m³) para os últimos 30 dias
    const consumptionData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 80) + 40); //Valores entre 40 e 120 m³
    // Simulação de dados: consumo estimado de recursos hídricos (em m³) para os últimos 30 dias
    const estimatedConsumptionData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 50); //Valores entre 50 e 150 m³
    const days = Array.from({ length: 30 }, (_, i) => `Dia ${i + 1}`); // Rótulos dos dias (ex.: Dia 1, Dia 2...)

    // Calcula a economia total
    this.totalSavings = consumptionData.reduce((acc, curr, index) => acc + (curr - estimatedConsumptionData[index]), 0);

    new Chart("lineChart", {
      type: 'line',
      data: {
      labels: days, // Rótulos do eixo X (dias)
      datasets: [
        {
        label: 'Consumo Diário (m³)',
        data: consumptionData, // Dados do eixo Y (consumo)
        borderColor: '#36A2EB', // Cor da linha
        backgroundColor: 'rgba(54, 162, 235, 0.2)', // Área preenchida abaixo da linha
        borderWidth: 2, // Largura da linha
        tension: 0.4 // Curvatura da linha
        },
        {
        label: 'Consumo Estimado (m³)',
        data: estimatedConsumptionData, // Dados do eixo Y (consumo estimado)
        borderColor: '#FF6384', // Cor da linha
        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Área preenchida abaixo da linha
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
          text: 'Consumo (m³)',
          font: { size: 14 }
        },
        beginAtZero: true // Começa o eixo Y no valor 0
        }
      }
      }
    });

    new Chart("lineChart", {
      type: 'line',
      data: {
        labels: days, // Rótulos do eixo X (dias)
        datasets: [
          {
            label: 'Consumo Diário (m³)',
            data: consumptionData, // Dados do eixo Y (consumo)
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
              text: 'Consumo (m³)',
              font: { size: 14 }
            },
            beginAtZero: true // Começa o eixo Y no valor 0
          }
        }
      }
    });
  }
}



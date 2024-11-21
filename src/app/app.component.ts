import { Component, OnInit } from '@angular/core';
import { WeatherService } from './shared/services/weather.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'AgroFlow';
  weatherData: any;
  filteredWeatherData: any;

  constructor(private weatherService: WeatherService) { }

  ngOnInit(): void {
    this.getWeatherData();
  }

  async getWeatherData(): Promise<void> {
    this.weatherService.getWeatherData(-22.412833, -45.449754).subscribe(
      data => {
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
}
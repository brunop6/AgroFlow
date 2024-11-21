import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private apiUrl = 'https://api-6wadomprwa-uc.a.run.app';

  constructor(private http: HttpClient) { }

  getWeatherData(lat: number, lon: number): Observable<any> {
    const url = `${this.apiUrl}/getWeatherData?lat=${lat}&lon=${lon}&exclude=minutely,hourly`;
    return this.http.get(url);
  }

  extractRainData(dailyForecast) {
    return dailyForecast.map(day => {
      return {
        date: new Date(day.dt * 1000).toISOString().split('T')[0], // Converte o timestamp para data (YYYY-MM-DD)
        probability: day.pop * 100, // Converte a probabilidade para porcentagem
        volume: day.rain || 0 // Volume de chuva (ou 0 se não houver)
      };
    });
  }
}
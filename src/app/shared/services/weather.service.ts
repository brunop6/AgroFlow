import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocaltionInterface } from '../interfaces/localtion-interface';
import { WeatherInterface } from '../interfaces/weather-interface';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private apiUrl = 'https://api-6wadomprwa-uc.a.run.app';

  public location: LocaltionInterface;
  public weatherData: WeatherInterface;

  constructor(private http: HttpClient) { }

  /**
   * Obtém os dados do clima para uma localização geográfica
   * @param lat Latitude
   * @param lon Longitude
   * @returns Dados do clima
   * @see https://openweathermap.org/api/one-call-api
   */
  getWeatherData(lat: number, lon: number): Observable<WeatherInterface> {
    const url = `${this.apiUrl}/getWeatherData?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly`;
    return this.http.get(url) as Observable<WeatherInterface>;
  }

  /**
   * Extrai os dados de precipitação diária do clima
   * @param dailyForecast Previsão diária do clima
   * @returns Dados de precipitação
   */
  extractRainData(dailyForecast): Object {
    return dailyForecast.map(day => {
      return {
        // Converte o timestamp para data (DD/MM/YYYY)
        date: new Date(day.dt * 1000).toLocaleDateString('pt-BR'), 
        // Converte a probabilidade para porcentagem com duas casas decimais
        probability: (day.pop * 100).toFixed(2), 
        // Volume de chuva (ou 0 se não houver) com duas casas decimais
        volume: (day.rain || 0).toFixed(2),

        Ra: day.Ra.toFixed(2),

        humidity: day.humidity.toFixed(2),

        temp: day.temp.day.toFixed(2)
      };
    });
  }

  /**
  * Calcula a radiação extraterrestre (Ra) em MJ/m²/dia
  * @param latitude Latitude do local em graus
  * @param timestamp Timestamp do dia em milissegundos (Unix time)
  * @returns Ra (MJ/m²/dia)
  * @see https://www.fao.org/4/x0490e/x0490e07.htm#solar%20radiation
  */
  calculateRa(latitude: number, timestamp: number): number {
    // Constante solar (MJ/m²/min)
    const Gsc = 0.0820;

    // Conversão de latitude para radianos
    const phi = (Math.PI / 180) * latitude;

    // Converter timestamp para o dia do ano
    const date = new Date(timestamp);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.ceil((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Fator de correção da distância Terra-Sol (dr)
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * dayOfYear);

    // Declinação solar (delta)
    const delta = 0.409 * Math.sin((2 * Math.PI / 365) * dayOfYear - 1.39);

    // Ângulo do pôr do sol (omega_s)
    const omega_s = Math.acos(-Math.tan(phi) * Math.tan(delta));

    // Ra (MJ/m²/dia)
    const Ra = (24 * 60 / Math.PI) * Gsc * dr * (omega_s * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(omega_s));

    return Ra;
  }
}
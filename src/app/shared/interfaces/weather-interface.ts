export interface WeatherInterface {
  alerts: any[];
  daily: {
    clouds: number;
    dew_point: number;
    dt: number;
    feels_like: {
      day: number;
      eve: number;
      morn: number;
      night: number;
    };
    humidity: number;
    moon_phase: number;
    moonrise: number;
    moonset: number;
    pop: number;
    pressure: number;
    Ra: number; // Radiação extraterrestre (MJ/m²/dia)
    rain: number;
    summary: string;
    sunrise: number;
    sunset: number;
    temp: {
      day: number;
      eve: number;
      max: number;
      min: number;
      morn: number;
      night: number;
    };
    uvi: number;
    weather: {
      description: string;
      icon: string;
      id: number;
      main: string;
    }[];
    wind_deg: number;
    wind_gust: number;
    wind_speed: number;
  }[];
}

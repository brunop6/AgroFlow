import { Component } from '@angular/core';
import { SensorService } from 'src/app/shared/services/sensor.service';

@Component({
  selector: 'app-sensor-message',
  templateUrl: './sensor-message.component.html',
  styleUrls: ['./sensor-message.component.scss']
})
export class SensorMessageComponent {
  culture: string = '';
  humidity: number;

  constructor(private sensorService: SensorService) {}

  onSubmit(): void {
    const timestamp = Date.now();
  }
}
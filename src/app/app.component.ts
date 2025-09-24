import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfigDialogComponent } from './components/dashboard/config-dialog/config-dialog.component';
import { WeatherService } from './shared/services/weather.service';
import { IrrigationService } from './shared/services/irrigation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'AgroFlow';

  // Adicionamos os serviços necessários ao construtor do AppComponent
  constructor(
    private router: Router,
    public dialog: MatDialog,
    protected weatherService: WeatherService,
    protected irrigationService: IrrigationService
  ) { }

  // Movemos a função para cá
  openConfigDialog(): void {
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
}
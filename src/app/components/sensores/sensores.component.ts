import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { SensorService, SensorState } from 'src/app/shared/services/sensor.service';
import { AddSensorDialogComponent } from '../dialogs/add-sensor-dialog/add-sensor-dialog.component';
import { SimulateSensorDialogComponent } from '../dialogs/simulate-sensor-dialog/simulate-sensor-dialog.component';
import { EditSensorDialogComponent } from '../dialogs/edit-sensor-dialog/edit-sensor-dialog.component'; // Importe o novo diálogo

@Component({
  selector: 'app-sensores',
  templateUrl: './sensores.component.html',
  styleUrls: ['./sensores.component.scss']
})
export class SensoresComponent implements OnInit {
  sensors$: Observable<SensorState[]>;
  private sensorList: SensorState[] = [];

  constructor(private sensorService: SensorService, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.sensors$ = this.sensorService.getSensorList();
    this.sensors$.subscribe(list => this.sensorList = list); 
  }

  adicionarSensor(): void {
    this.dialog.open(AddSensorDialogComponent, {
      width: '500px',
      disableClose: true
    });
  }

  openSimulateDialog(): void {
    this.dialog.open(SimulateSensorDialogComponent, {
      width: '400px'
    });
  }

 configureSensor(sensorId: string): void {
    const sensorToConfigure = this.sensorList.find(s => s.id === sensorId);
    if (!sensorToConfigure) {
      console.error("Não foi possível encontrar o sensor para configurar.");
      return;
    }

    const dialogRef = this.dialog.open(EditSensorDialogComponent, {
      width: '500px',
      data: { sensor: sensorToConfigure }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Diálogo de configuração fechado, salvando dados:', result);
        this.sensorService.updateSensorMetadata(sensorId, result);
      }
    });
  }

  removerSensor(sensor: SensorState): void {
    if (confirm(`Tem certeza que deseja remover e resetar o sensor '${sensor.id}'?`)) {
      this.sensorService.requestSensorReset(sensor.id);
    }
  }

  formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString('pt-BR');
  }
}
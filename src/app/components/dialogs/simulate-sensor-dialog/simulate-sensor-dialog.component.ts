import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SensorService } from 'src/app/shared/services/sensor.service';

@Component({
  selector: 'app-simulate-sensor-dialog',
  templateUrl: './simulate-sensor-dialog.component.html',
})
export class SimulateSensorDialogComponent implements OnInit {
  simulateForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sensorService: SensorService,
    public dialogRef: MatDialogRef<SimulateSensorDialogComponent>
  ) {}

  ngOnInit(): void {
    this.simulateForm = this.fb.group({
      id: ['', Validators.required],
      humidity: [null, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  onSubmit(): void {
    if (this.simulateForm.valid) {
      const { id, humidity } = this.simulateForm.value;
      this.sensorService.publishSimulatedData(id, humidity);
      this.dialogRef.close();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
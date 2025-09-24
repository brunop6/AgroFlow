import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SensorState } from 'src/app/shared/services/sensor.service';

@Component({
  selector: 'app-edit-sensor-dialog',
  templateUrl: './edit-sensor-dialog.component.html',
  styleUrls: ['./edit-sensor-dialog.component.scss']
})
export class EditSensorDialogComponent implements OnInit {
  editForm: FormGroup;
  locationError: string | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditSensorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { sensor: SensorState }
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      name: [this.data.sensor.name || '', Validators.required],
      culture: [this.data.sensor.culture || '', Validators.required],
      lat: [this.data.sensor.lat || null, Validators.required],
      lon: [this.data.sensor.lon || null, Validators.required]
    });
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.editForm.patchValue({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          this.locationError = null;
        },
        (error) => {
          this.locationError = "Não foi possível obter a localização.";
          console.error(error);
        }
      );
    } else {
      this.locationError = "Geolocalização não é suportada por este navegador.";
    }
  }

  onSave(): void {
    if (this.editForm.valid) {
      this.dialogRef.close(this.editForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
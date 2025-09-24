import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-sensor-dialog',
  templateUrl: './add-sensor-dialog.component.html',
  styleUrls: ['./add-sensor-dialog.component.scss']
})
export class AddSensorDialogComponent implements OnInit {
  form: FormGroup;
  locationError: string | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddSensorDialogComponent>
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      culture: ['', Validators.required],
      ssid: ['', Validators.required],
      password: [''],
      lat: [null, Validators.required],
      lon: [null, Validators.required]
    });
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.form.patchValue({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          this.locationError = null;
          console.log('Localização obtida:', position.coords);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              this.locationError = "Permissão para acessar a localização foi negada.";
              break;
            case error.POSITION_UNAVAILABLE:
              this.locationError = "Informação de localização não está disponível.";
              break;
            case error.TIMEOUT:
              this.locationError = "A requisição de localização expirou.";
              break;
            default:
              this.locationError = "Ocorreu um erro desconhecido ao obter a localização.";
              break;
          }
          console.error(this.locationError, error);
        }
      );
    } else {
      this.locationError = "Geolocalização não é suportada por este navegador.";
      console.error(this.locationError);
    }
  }

  onSave(): void {
    if (this.form.valid) {
      console.log('Dados do sensor para configuração manual:', this.form.value);
      this.dialogRef.close();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
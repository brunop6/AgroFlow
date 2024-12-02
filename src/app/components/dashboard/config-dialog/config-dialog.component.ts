import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IrrigationService } from 'src/app/shared/services/irrigation.service';
import { WeatherService } from 'src/app/shared/services/weather.service';
@Component({
  selector: 'app-config-dialog',
  templateUrl: './config-dialog.component.html',
  styleUrls: ['./config-dialog.component.scss'],
})
export class ConfigDialogComponent implements OnInit {
  protected configForm!: FormGroup;

  protected irrigationTypes = Object.keys(this.irrigationService.efficiencies).filter((type) => !type.includes('Chuva'));
  protected config: IrrigationService['irrigationData']['config'] = this.irrigationService.irrigationData.config;

  constructor(
    private irrigationService: IrrigationService,
    private weatherService: WeatherService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.configForm = this.fb.group({
      irrigationType: [this.data?.irrigationType || null, Validators.required],
      Kc: [this.data?.Kc || null, [Validators.required, Validators.min(0), Validators.max(2)]],
      minMoisture: [this.data?.minMoisture || null, [Validators.required, Validators.min(0), Validators.max(100)]],
      maxMoisture: [this.data?.maxMoisture || null, [Validators.required, Validators.min(0), Validators.max(100)]],
      maxHeight: [this.data?.maxHeight || '']
    });

    this.configForm.valueChanges.subscribe(() => {
      this.config.Efc = [];
      
      this.config.Ef = this.irrigationService.getAverageEfficiency(this.configForm.value.irrigationType);
      this.weatherService.weatherData.daily.forEach((day) => {
        this.config.Efc.push(this.irrigationService.getAverageEfficiency(this.configForm.value.water, day.rain));
      });
      this.config.Kc = this.configForm.value.Kc;
      this.config.minMoisture = this.configForm.value.minMoisture;
      this.config.maxMoisture = this.configForm.value.maxMoisture;
      this.config.irrigationType = this.configForm.value.irrigationType;
      this.config.maxHeight = this.configForm.value.maxHeight;
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.configForm.valid) {
      this.irrigationService.irrigationData.config = this.config;

      localStorage.setItem('irrigationConfig', JSON.stringify(this.irrigationService.irrigationData.config));
      
      this.irrigationService.irrigationData.status = 'ready';
      this.dialogRef.close(this.configForm.value);
    } else {
      alert('Preencha todos os campos corretamente!');
    }
  }
}

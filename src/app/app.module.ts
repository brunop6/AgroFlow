// src/app/app.module.ts
import { NgModule, LOCALE_ID } from '@angular/core'; // <--- Adicione LOCALE_ID
import { registerLocaleData } from '@angular/common'; // <--- Importe isso
import localePt from '@angular/common/locales/pt';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// --- Módulos do Angular Material ---
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

// --- Componentes e Roteamento ---
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from 'src/environments/environment';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigDialogComponent } from './components/dashboard/config-dialog/config-dialog.component';
import { SensoresComponent } from './components/sensores/sensores.component';
import { AddSensorDialogComponent } from './components/dialogs/add-sensor-dialog/add-sensor-dialog.component';
import { SimulateSensorDialogComponent } from './components/dialogs/simulate-sensor-dialog/simulate-sensor-dialog.component';
import { EditSensorDialogComponent } from './components/dialogs/edit-sensor-dialog/edit-sensor-dialog.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MapaComponent } from './components/mapa/mapa.component';

registerLocaleData(localePt);

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ConfigDialogComponent,
    SensoresComponent,
    AddSensorDialogComponent,
    EditSensorDialogComponent,
    SimulateSensorDialogComponent,
    SidebarComponent,
    MapaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
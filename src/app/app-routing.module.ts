import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent/*, SensorMessageComponent*/} from './components';
import { SensoresComponent } from './components/sensores/sensores.component';
import { MapaComponent } from './components/mapa/mapa.component';

const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: 'dashboard', component: DashboardComponent},
  //{ path: 'sensor-message', component: SensorMessageComponent },
  { path: 'sensores', component: SensoresComponent },
  { path: 'mapa', component: MapaComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }

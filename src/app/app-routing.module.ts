import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent/*, SensorMessageComponent*/} from './components';
import { SensoresComponent } from './components/sensores/sensores.component';

const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: 'dashboard', component: DashboardComponent},
  //{ path: 'sensor-message', component: SensorMessageComponent },
  { path: 'sensores', component: SensoresComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }

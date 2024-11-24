import { Component, OnInit } from '@angular/core';
import { WeatherService } from './shared/services/weather.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'AgroFlow';

  constructor(private router: Router) { }
}
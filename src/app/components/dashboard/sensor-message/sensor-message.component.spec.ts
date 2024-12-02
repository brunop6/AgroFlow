import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorMessageComponent } from './sensor-message.component';

describe('SensorMessageComponent', () => {
  let component: SensorMessageComponent;
  let fixture: ComponentFixture<SensorMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SensorMessageComponent]
    });
    fixture = TestBed.createComponent(SensorMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

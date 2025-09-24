import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulateSensorDialogComponent } from './simulate-sensor-dialog.component';

describe('SimulateSensorDialogComponent', () => {
  let component: SimulateSensorDialogComponent;
  let fixture: ComponentFixture<SimulateSensorDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SimulateSensorDialogComponent]
    });
    fixture = TestBed.createComponent(SimulateSensorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

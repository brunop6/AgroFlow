import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigDialogComponent } from './config-dialog.component';

describe('ConfigDialogComponent', () => {
  let component: ConfigDialogComponent;
  let fixture: ComponentFixture<ConfigDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigDialogComponent]
    });
    fixture = TestBed.createComponent(ConfigDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { IrrigationService } from './irrigation.service';

describe('IrrigationService', () => {
  let service: IrrigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IrrigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

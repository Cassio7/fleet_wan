import { TestBed } from '@angular/core/testing';

import { GpsFilterService } from './gps-filter.service';

describe('GpsFilterService', () => {
  let service: GpsFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GpsFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { AntennaFilterService } from './antenna-filter.service';

describe('AntennaFilterService', () => {
  let service: AntennaFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AntennaFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

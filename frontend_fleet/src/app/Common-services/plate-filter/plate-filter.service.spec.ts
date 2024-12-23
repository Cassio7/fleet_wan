import { TestBed } from '@angular/core/testing';

import { PlateFilterService } from './plate-filter.service';

describe('PlateFilterService', () => {
  let service: PlateFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlateFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

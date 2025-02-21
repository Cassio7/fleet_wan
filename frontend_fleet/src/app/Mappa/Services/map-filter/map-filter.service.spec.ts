import { TestBed } from '@angular/core/testing';

import { MapFilterService } from './map-filter.service';

describe('MapFilterService', () => {
  let service: MapFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

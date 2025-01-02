import { TestBed } from '@angular/core/testing';

import { GpsGraphService } from './gps-graph.service';

describe('GpsGraphService', () => {
  let service: GpsGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GpsGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

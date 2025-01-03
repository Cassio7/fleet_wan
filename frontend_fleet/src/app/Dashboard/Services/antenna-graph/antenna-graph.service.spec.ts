import { TestBed } from '@angular/core/testing';

import { AntennaGraphService } from './antenna-graph.service';

describe('AntennaGraphService', () => {
  let service: AntennaGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AntennaGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

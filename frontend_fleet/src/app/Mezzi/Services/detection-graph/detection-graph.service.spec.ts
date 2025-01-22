import { TestBed } from '@angular/core/testing';

import { DetectionGraphService } from './detection-graph.service';

describe('DetectionGraphService', () => {
  let service: DetectionGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetectionGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

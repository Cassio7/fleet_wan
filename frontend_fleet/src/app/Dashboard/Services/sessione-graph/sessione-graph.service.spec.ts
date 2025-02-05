import { TestBed } from '@angular/core/testing';

import { SessioneGraphService } from './sessione-graph.service';

describe('SessioneGraphService', () => {
  let service: SessioneGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessioneGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

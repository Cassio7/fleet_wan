import { TestBed } from '@angular/core/testing';

import { BlackboxGraphsService } from './blackbox-graphs.service';

describe('BlackboxGraphsService', () => {
  let service: BlackboxGraphsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlackboxGraphsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

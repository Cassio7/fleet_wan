import { TestBed } from '@angular/core/testing';

import { SessionFilterService } from './session-filter.service';

describe('SessionFilterService', () => {
  let service: SessionFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { FirstEventsFilterService } from './first-events-filter.service';

describe('FirstEventsFilterService', () => {
  let service: FirstEventsFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirstEventsFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

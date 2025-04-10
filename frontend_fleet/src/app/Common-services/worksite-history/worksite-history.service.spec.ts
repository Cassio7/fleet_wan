import { TestBed } from '@angular/core/testing';

import { WorksiteHistoryService } from './worksite-history.service';

describe('WorksiteHistoryService', () => {
  let service: WorksiteHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorksiteHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

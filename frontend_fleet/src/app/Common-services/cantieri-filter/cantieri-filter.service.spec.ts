import { TestBed } from '@angular/core/testing';

import { CantieriFilterService } from './cantieri-filter.service';

describe('CantieriFilterService', () => {
  let service: CantieriFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CantieriFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

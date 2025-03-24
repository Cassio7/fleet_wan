import { TestBed } from '@angular/core/testing';

import { LettureFilterService } from './letture-filter.service';

describe('LettureFilterService', () => {
  let service: LettureFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LettureFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

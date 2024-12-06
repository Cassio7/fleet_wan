import { TestBed } from '@angular/core/testing';

import { MezziFilterService } from './mezzi-filter.service';

describe('MezziFilterService', () => {
  let service: MezziFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MezziFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

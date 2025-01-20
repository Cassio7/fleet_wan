import { TestBed } from '@angular/core/testing';

import { MezziFiltersService } from './mezzi-filters.service';

describe('MezziFiltersService', () => {
  let service: MezziFiltersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MezziFiltersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { FiltersCommonService } from './filters-common.service';

describe('FiltersCommonService', () => {
  let service: FiltersCommonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FiltersCommonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { ModelFilterService } from './model-filter.service';

describe('ModelFilterService', () => {
  let service: ModelFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

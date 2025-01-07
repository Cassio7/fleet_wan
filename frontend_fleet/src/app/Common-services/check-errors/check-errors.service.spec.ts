import { TestBed } from '@angular/core/testing';

import { CheckErrorsService } from './check-errors.service';

describe('CheckErrorsService', () => {
  let service: CheckErrorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckErrorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

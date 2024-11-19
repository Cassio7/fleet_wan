import { TestBed } from '@angular/core/testing';

import { ErrorGraphsService } from './error-graphs.service';

describe('ErrorGraphsService', () => {
  let service: ErrorGraphsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorGraphsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { SpeedsService } from './speeds.service';

describe('SpeedsService', () => {
  let service: SpeedsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeedsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

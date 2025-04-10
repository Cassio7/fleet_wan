import { TestBed } from '@angular/core/testing';

import { WorkzoneService } from './workzone.service';

describe('WorkzoneService', () => {
  let service: WorkzoneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkzoneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

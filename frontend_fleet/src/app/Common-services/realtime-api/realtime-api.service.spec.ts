import { TestBed } from '@angular/core/testing';

import { RealtimeApiService } from './realtime-api.service';

describe('RealtimeApiService', () => {
  let service: RealtimeApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RealtimeApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

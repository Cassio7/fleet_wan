import { TestBed } from '@angular/core/testing';

import { VehiclesApiService } from './vehicles-api.service';

describe('VehiclesApiService', () => {
  let service: VehiclesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VehiclesApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

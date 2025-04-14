import { TestBed } from '@angular/core/testing';

import { GestioneSocietaService } from './gestione-societa.service';

describe('GestioneSocietaService', () => {
  let service: GestioneSocietaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestioneSocietaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

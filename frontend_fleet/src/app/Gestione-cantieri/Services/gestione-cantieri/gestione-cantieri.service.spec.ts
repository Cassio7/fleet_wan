import { TestBed } from '@angular/core/testing';

import { GestioneCantieriService } from './gestione-cantieri.service';

describe('GestioneCantieriService', () => {
  let service: GestioneCantieriService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestioneCantieriService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

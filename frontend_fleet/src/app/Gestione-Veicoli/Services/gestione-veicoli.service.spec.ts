import { TestBed } from '@angular/core/testing';

import { GestioneVeicoliService } from './gestione-veicoli.service';

describe('GestioneVeicoliService', () => {
  let service: GestioneVeicoliService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestioneVeicoliService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

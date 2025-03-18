import { TestBed } from '@angular/core/testing';

import { GestioneService } from './gestione.service';

describe('GestioneService', () => {
  let service: GestioneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestioneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

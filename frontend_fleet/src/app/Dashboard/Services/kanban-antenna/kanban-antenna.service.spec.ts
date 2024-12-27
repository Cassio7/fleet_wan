import { TestBed } from '@angular/core/testing';

import { KanbanAntennaService } from './kanban-antenna.service';

describe('KanbanAntennaService', () => {
  let service: KanbanAntennaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KanbanAntennaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

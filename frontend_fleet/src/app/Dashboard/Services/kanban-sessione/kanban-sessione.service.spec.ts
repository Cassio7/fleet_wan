import { TestBed } from '@angular/core/testing';

import { KanbanSessioneService } from './kanban-sessione.service';

describe('KanbanSessioneService', () => {
  let service: KanbanSessioneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KanbanSessioneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

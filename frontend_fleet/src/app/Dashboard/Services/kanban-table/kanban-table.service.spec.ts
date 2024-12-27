import { TestBed } from '@angular/core/testing';

import { KanbanTableService } from './kanban-table.service';

describe('KanbanTableService', () => {
  let service: KanbanTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KanbanTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

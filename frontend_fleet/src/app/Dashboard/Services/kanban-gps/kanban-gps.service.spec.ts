import { TestBed } from '@angular/core/testing';

import { KanbanGpsService } from './kanban-gps.service';

describe('KanbanGpsService', () => {
  let service: KanbanGpsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KanbanGpsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

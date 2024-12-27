import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanFiltersComponent } from './kanban-filters.component';

describe('KanbanFiltersComponent', () => {
  let component: KanbanFiltersComponent;
  let fixture: ComponentFixture<KanbanFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

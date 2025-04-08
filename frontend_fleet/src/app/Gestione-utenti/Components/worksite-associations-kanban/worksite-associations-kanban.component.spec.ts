import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorksiteAssociationsKanbanComponent } from './worksite-associations-kanban.component';

describe('WorksiteAssociationsKanbanComponent', () => {
  let component: WorksiteAssociationsKanbanComponent;
  let fixture: ComponentFixture<WorksiteAssociationsKanbanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorksiteAssociationsKanbanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorksiteAssociationsKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

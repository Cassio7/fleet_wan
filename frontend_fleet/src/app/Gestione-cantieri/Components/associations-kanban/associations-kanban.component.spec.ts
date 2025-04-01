import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociationsKanbanComponent } from './associations-kanban.component';

describe('AssociationsKanbanComponent', () => {
  let component: AssociationsKanbanComponent;
  let fixture: ComponentFixture<AssociationsKanbanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssociationsKanbanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssociationsKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

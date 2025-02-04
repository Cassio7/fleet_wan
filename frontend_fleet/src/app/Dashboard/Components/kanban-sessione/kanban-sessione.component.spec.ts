import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanSessioneComponent } from './kanban-sessione.component';

describe('KanbanSessioneComponent', () => {
  let component: KanbanSessioneComponent;
  let fixture: ComponentFixture<KanbanSessioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanSessioneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanSessioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

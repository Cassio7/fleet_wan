import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanAntennaComponent } from './kanban-antenna.component';

describe('KanbanAntennaComponent', () => {
  let component: KanbanAntennaComponent;
  let fixture: ComponentFixture<KanbanAntennaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanAntennaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanAntennaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

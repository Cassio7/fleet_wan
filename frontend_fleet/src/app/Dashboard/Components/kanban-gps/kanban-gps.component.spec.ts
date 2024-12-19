import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanGpsComponent } from './kanban-gps.component';

describe('KanbanGpsComponent', () => {
  let component: KanbanGpsComponent;
  let fixture: ComponentFixture<KanbanGpsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanGpsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanbanGpsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

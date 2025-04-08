import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyAssociationsKanbanComponent } from './company-associations-kanban.component';

describe('CompanyAssociationsKanbanComponent', () => {
  let component: CompanyAssociationsKanbanComponent;
  let fixture: ComponentFixture<CompanyAssociationsKanbanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyAssociationsKanbanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyAssociationsKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

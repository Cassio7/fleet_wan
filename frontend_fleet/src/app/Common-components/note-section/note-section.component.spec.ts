import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteSectionComponent } from './note-section.component';

describe('NoteSectionComponent', () => {
  let component: NoteSectionComponent;
  let fixture: ComponentFixture<NoteSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

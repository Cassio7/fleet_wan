import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettureFiltersComponent } from './letture-filters.component';

describe('LettureFiltersComponent', () => {
  let component: LettureFiltersComponent;
  let fixture: ComponentFixture<LettureFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettureFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettureFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

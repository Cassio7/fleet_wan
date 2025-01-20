import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MezziFiltersComponent } from './mezzi-filters.component';

describe('MezziFiltersComponent', () => {
  let component: MezziFiltersComponent;
  let fixture: ComponentFixture<MezziFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MezziFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MezziFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

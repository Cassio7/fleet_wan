import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CantiereEditFiltersComponent } from './cantiere-edit-filters.component';

describe('CantiereEditFiltersComponent', () => {
  let component: CantiereEditFiltersComponent;
  let fixture: ComponentFixture<CantiereEditFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CantiereEditFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CantiereEditFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

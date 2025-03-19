import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CantieriFiltersComponent } from './cantieri-filters.component';

describe('CantieriFiltersComponent', () => {
  let component: CantieriFiltersComponent;
  let fixture: ComponentFixture<CantieriFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CantieriFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CantieriFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

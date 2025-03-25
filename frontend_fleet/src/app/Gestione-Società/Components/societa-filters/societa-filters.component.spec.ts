import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocietaFiltersComponent } from './societa-filters.component';

describe('SocietaFiltersComponent', () => {
  let component: SocietaFiltersComponent;
  let fixture: ComponentFixture<SocietaFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocietaFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocietaFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

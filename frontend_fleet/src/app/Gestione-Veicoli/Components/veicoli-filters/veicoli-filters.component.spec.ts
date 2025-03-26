import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeicoliFiltersComponent } from './veicoli-filters.component';

describe('VeicoliFiltersComponent', () => {
  let component: VeicoliFiltersComponent;
  let fixture: ComponentFixture<VeicoliFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeicoliFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VeicoliFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

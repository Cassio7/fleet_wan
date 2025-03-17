import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestioneFiltersComponent } from './gestione-filters.component';

describe('GestioneFiltersComponent', () => {
  let component: GestioneFiltersComponent;
  let fixture: ComponentFixture<GestioneFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestioneFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestioneFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

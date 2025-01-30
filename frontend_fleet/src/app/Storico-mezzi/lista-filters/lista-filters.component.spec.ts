import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaFiltersComponent } from './lista-filters.component';

describe('ListaFiltersComponent', () => {
  let component: ListaFiltersComponent;
  let fixture: ComponentFixture<ListaFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

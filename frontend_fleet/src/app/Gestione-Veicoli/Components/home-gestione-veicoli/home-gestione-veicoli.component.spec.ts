import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeGestioneVeicoliComponent } from './home-gestione-veicoli.component';

describe('HomeGestioneVeicoliComponent', () => {
  let component: HomeGestioneVeicoliComponent;
  let fixture: ComponentFixture<HomeGestioneVeicoliComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeGestioneVeicoliComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeGestioneVeicoliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

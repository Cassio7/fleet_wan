import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeGestioneCantieriComponent } from './home-gestione-cantieri.component';

describe('HomeGestioneCantieriComponent', () => {
  let component: HomeGestioneCantieriComponent;
  let fixture: ComponentFixture<HomeGestioneCantieriComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeGestioneCantieriComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeGestioneCantieriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

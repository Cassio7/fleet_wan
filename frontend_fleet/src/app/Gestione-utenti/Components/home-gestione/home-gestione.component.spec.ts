import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeGestioneComponent } from './home-gestione.component';

describe('HomeGestioneComponent', () => {
  let component: HomeGestioneComponent;
  let fixture: ComponentFixture<HomeGestioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeGestioneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeGestioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

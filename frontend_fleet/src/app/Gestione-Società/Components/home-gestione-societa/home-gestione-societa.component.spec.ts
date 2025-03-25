import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeGestioneSocietaComponent } from './home-gestione-societa.component';

describe('HomeGestioneSocietaComponent', () => {
  let component: HomeGestioneSocietaComponent;
  let fixture: ComponentFixture<HomeGestioneSocietaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeGestioneSocietaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeGestioneSocietaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

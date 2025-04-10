import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeVeicoloEditComponent } from './home-veicolo-edit.component';

describe('HomeVeicoloEditComponent', () => {
  let component: HomeVeicoloEditComponent;
  let fixture: ComponentFixture<HomeVeicoloEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeVeicoloEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeVeicoloEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

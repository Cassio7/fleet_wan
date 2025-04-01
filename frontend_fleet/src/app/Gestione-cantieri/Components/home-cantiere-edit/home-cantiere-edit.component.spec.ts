import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeCantiereEditComponent } from './home-cantiere-edit.component';

describe('HomeCantiereEditComponent', () => {
  let component: HomeCantiereEditComponent;
  let fixture: ComponentFixture<HomeCantiereEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeCantiereEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeCantiereEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

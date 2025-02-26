import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeProfileComponent } from './home-profile.component';

describe('HomeProfileComponent', () => {
  let component: HomeProfileComponent;
  let fixture: ComponentFixture<HomeProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

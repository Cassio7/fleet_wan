import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeTopSpeedsComponent } from './home-top-speeds.component';

describe('HomeTopSpeedsComponent', () => {
  let component: HomeTopSpeedsComponent;
  let fixture: ComponentFixture<HomeTopSpeedsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTopSpeedsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeTopSpeedsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

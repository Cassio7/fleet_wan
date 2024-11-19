import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeMezziComponent } from './home-mezzi.component';

describe('HomeMezziComponent', () => {
  let component: HomeMezziComponent;
  let fixture: ComponentFixture<HomeMezziComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeMezziComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeMezziComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

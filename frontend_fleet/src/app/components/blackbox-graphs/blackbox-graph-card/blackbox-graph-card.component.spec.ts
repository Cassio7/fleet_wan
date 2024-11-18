import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlackboxGraphCardComponent } from './blackbox-graph-card.component';

describe('BlackboxGraphCardComponent', () => {
  let component: BlackboxGraphCardComponent;
  let fixture: ComponentFixture<BlackboxGraphCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlackboxGraphCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlackboxGraphCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

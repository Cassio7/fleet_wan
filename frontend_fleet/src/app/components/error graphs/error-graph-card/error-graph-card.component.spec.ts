import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorGraphCardComponent } from './error-graph-card.component';

describe('ErrorGraphCardComponent', () => {
  let component: ErrorGraphCardComponent;
  let fixture: ComponentFixture<ErrorGraphCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorGraphCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorGraphCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

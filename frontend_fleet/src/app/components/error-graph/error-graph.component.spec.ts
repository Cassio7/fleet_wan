import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorGraphComponent } from './error-graph.component';

describe('ErrorGraphComponent', () => {
  let component: ErrorGraphComponent;
  let fixture: ComponentFixture<ErrorGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

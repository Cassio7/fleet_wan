import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorPieGraphComponent } from './error-pie-graph.component';

describe('ErrorPieGraphComponent', () => {
  let component: ErrorPieGraphComponent;
  let fixture: ComponentFixture<ErrorPieGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorPieGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorPieGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

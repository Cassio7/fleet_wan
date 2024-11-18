import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorBarGraphComponent } from './error-bar-graph.component';

describe('ErrorBarGraphComponent', () => {
  let component: ErrorBarGraphComponent;
  let fixture: ComponentFixture<ErrorBarGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBarGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorBarGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

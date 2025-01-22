import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectionGraphComponent } from './detection-graph.component';

describe('DetectionGraphComponent', () => {
  let component: DetectionGraphComponent;
  let fixture: ComponentFixture<DetectionGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetectionGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetectionGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlackboxPieGraphComponent } from './blackbox-pie-graph.component';

describe('BlackboxPieGraphComponent', () => {
  let component: BlackboxPieGraphComponent;
  let fixture: ComponentFixture<BlackboxPieGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlackboxPieGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlackboxPieGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

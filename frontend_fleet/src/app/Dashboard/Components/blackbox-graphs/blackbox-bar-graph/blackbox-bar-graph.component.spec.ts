import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlackboxBarGraphComponent } from './blackbox-bar-graph.component';

describe('BlackboxBarGraphComponent', () => {
  let component: BlackboxBarGraphComponent;
  let fixture: ComponentFixture<BlackboxBarGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlackboxBarGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlackboxBarGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

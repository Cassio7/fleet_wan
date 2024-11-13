import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlackboxGraphComponent } from './blackbox-graph.component';

describe('BlackboxGraphComponent', () => {
  let component: BlackboxGraphComponent;
  let fixture: ComponentFixture<BlackboxGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlackboxGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlackboxGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpsGraphComponent } from './gps-graph.component';

describe('GpsGraphComponent', () => {
  let component: GpsGraphComponent;
  let fixture: ComponentFixture<GpsGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GpsGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpsGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

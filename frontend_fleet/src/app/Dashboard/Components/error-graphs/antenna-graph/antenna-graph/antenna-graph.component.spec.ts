import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AntennaGraphComponent } from './antenna-graph.component';

describe('AntennaGraphComponent', () => {
  let component: AntennaGraphComponent;
  let fixture: ComponentFixture<AntennaGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AntennaGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AntennaGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

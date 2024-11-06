import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokenVehiclesPageComponent } from './broken-vehicles-page.component';

describe('BrokenVehiclesPageComponent', () => {
  let component: BrokenVehiclesPageComponent;
  let fixture: ComponentFixture<BrokenVehiclesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrokenVehiclesPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrokenVehiclesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

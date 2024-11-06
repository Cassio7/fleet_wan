import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingVehiclesPageComponent } from './working-vehicles-page.component';

describe('WorkingVehiclesPageComponent', () => {
  let component: WorkingVehiclesPageComponent;
  let fixture: ComponentFixture<WorkingVehiclesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkingVehiclesPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingVehiclesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

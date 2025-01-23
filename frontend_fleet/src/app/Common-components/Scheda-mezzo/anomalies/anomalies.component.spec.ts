import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnomaliesComponent } from './anomalies.component';

describe('AnomaliesComponent', () => {
  let component: AnomaliesComponent;
  let fixture: ComponentFixture<AnomaliesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnomaliesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnomaliesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

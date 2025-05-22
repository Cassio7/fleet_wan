import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointResearchComponent } from './point-research.component';

describe('PointResearchComponent', () => {
  let component: PointResearchComponent;
  let fixture: ComponentFixture<PointResearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointResearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointResearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

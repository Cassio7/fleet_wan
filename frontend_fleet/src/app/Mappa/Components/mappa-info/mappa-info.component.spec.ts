import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MappaInfoComponent } from './mappa-info.component';

describe('MappaInfoComponent', () => {
  let component: MappaInfoComponent;
  let fixture: ComponentFixture<MappaInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MappaInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MappaInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

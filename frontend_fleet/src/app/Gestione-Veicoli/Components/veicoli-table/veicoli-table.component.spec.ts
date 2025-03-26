import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeicoliTableComponent } from './veicoli-table.component';

describe('VeicoliTableComponent', () => {
  let component: VeicoliTableComponent;
  let fixture: ComponentFixture<VeicoliTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeicoliTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VeicoliTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

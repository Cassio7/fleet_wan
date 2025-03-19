import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CantieriTableComponent } from './cantieri-table.component';

describe('CantieriTableComponent', () => {
  let component: CantieriTableComponent;
  let fixture: ComponentFixture<CantieriTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CantieriTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CantieriTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocietaTableComponent } from './societa-table.component';

describe('SocietaTableComponent', () => {
  let component: SocietaTableComponent;
  let fixture: ComponentFixture<SocietaTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocietaTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocietaTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

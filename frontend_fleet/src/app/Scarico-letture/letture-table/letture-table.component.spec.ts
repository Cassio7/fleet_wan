import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LettureTableComponent } from './letture-table.component';

describe('LettureTableComponent', () => {
  let component: LettureTableComponent;
  let fixture: ComponentFixture<LettureTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LettureTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LettureTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

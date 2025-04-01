import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveCantiereDialogComponent } from './move-cantiere-dialog.component';

describe('MoveCantiereDialogComponent', () => {
  let component: MoveCantiereDialogComponent;
  let fixture: ComponentFixture<MoveCantiereDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveCantiereDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoveCantiereDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

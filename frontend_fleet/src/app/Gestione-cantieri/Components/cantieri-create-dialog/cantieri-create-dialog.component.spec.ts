import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CantieriCreateDialogComponent } from './cantieri-create-dialog.component';

describe('CantieriCreateDialogComponent', () => {
  let component: CantieriCreateDialogComponent;
  let fixture: ComponentFixture<CantieriCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CantieriCreateDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CantieriCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

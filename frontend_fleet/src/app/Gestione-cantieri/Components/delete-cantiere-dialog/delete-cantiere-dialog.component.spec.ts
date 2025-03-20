import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteCantiereDialogComponent } from './delete-cantiere-dialog.component';

describe('DeleteCantiereDialogComponent', () => {
  let component: DeleteCantiereDialogComponent;
  let fixture: ComponentFixture<DeleteCantiereDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteCantiereDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteCantiereDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

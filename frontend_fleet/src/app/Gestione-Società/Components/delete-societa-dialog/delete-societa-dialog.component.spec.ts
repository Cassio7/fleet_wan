import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteSocietaDialogComponent } from './delete-societa-dialog.component';

describe('DeleteSocietaDialogComponent', () => {
  let component: DeleteSocietaDialogComponent;
  let fixture: ComponentFixture<DeleteSocietaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteSocietaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteSocietaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

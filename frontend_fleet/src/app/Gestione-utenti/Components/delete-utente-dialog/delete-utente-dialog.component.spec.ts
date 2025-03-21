import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteUtenteDialogComponent } from './delete-utente-dialog.component';

describe('DeleteUtenteDialogComponent', () => {
  let component: DeleteUtenteDialogComponent;
  let fixture: ComponentFixture<DeleteUtenteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteUtenteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteUtenteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

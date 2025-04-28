import { Component, inject, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-utente-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './delete-utente-dialog.component.html',
  styleUrl: './delete-utente-dialog.component.css'
})
export class DeleteUtenteDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeleteUtenteDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: {username: string}){}

  yesClick(){
    this.dialogRef.close(true);
  }

  noClick(){
    this.dialogRef.close(false);
  }
}

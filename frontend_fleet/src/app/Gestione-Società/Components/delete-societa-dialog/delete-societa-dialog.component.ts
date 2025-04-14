import { Component, inject, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteCantiereDialogComponent } from '../../../Gestione-cantieri/Components/delete-cantiere-dialog/delete-cantiere-dialog.component';

@Component({
  selector: 'app-delete-societa-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './delete-societa-dialog.component.html',
  styleUrl: './delete-societa-dialog.component.css'
})
export class DeleteSocietaDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeleteCantiereDialogComponent>); // Correct type

  constructor(@Inject(MAT_DIALOG_DATA) public data: {companyName: string}){}

  yesClick(){
    this.dialogRef.close(true);
  }

  noClick(){
    this.dialogRef.close(false);
  }
}

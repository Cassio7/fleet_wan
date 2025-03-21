import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-cantiere-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './delete-cantiere-dialog.component.html',
  styleUrl: './delete-cantiere-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteCantiereDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeleteCantiereDialogComponent>); // Correct type

  constructor(@Inject(MAT_DIALOG_DATA) public data: {worksiteName: string}){}

  yesClick(){
    this.dialogRef.close(true);
  }

  noClick(){
    this.dialogRef.close(false);
  }
}

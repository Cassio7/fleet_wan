import { AfterViewChecked, ChangeDetectorRef, Component, Inject, Input } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-note-snackbar',
  standalone: true,
  imports: [
    MatSnackBarModule
  ],
  templateUrl: './note-snackbar.component.html',
  styleUrl: './note-snackbar.component.css'
})
export class NoteSnackbarComponent implements AfterViewChecked{
  innerText: string = "";

  constructor(private cd: ChangeDetectorRef, @Inject(MAT_SNACK_BAR_DATA) public data: any) {}

  ngAfterViewChecked(): void {
    this.innerText = this.data.content;
    this.cd.detectChanges();
  }
}

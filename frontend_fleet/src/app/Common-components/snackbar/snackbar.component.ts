import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MatSnackBarModule, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [
    MatSnackBarModule
  ],
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.css'
})
export class SnackbarComponent {
  innerText: string = "";

  constructor(private cd: ChangeDetectorRef, @Inject(MAT_SNACK_BAR_DATA) public data: any) {}

  ngAfterViewChecked(): void {
    this.innerText = this.data.content;
    this.cd.detectChanges();
  }
}

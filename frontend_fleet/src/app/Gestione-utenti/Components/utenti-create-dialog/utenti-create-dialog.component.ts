import {ChangeDetectionStrategy, Component, inject, model, signal} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { DialogData, HomeGestioneComponent } from '../home-gestione/home-gestione.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-utenti-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  templateUrl: './utenti-create-dialog.component.html',
  styleUrl: './utenti-create-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtentiCreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<HomeGestioneComponent>);
  createUserForm: FormGroup;

  constructor(){
    this.createUserForm = new FormGroup({
      name: new FormControl('giulio', Validators.required),
      surname: new FormControl('Verdi', Validators.required),
      username: new FormControl('PEDRO', Validators.required),
      email: new FormControl('marco@nomail.com', [Validators.required, Validators.email]),
      password: new FormControl('password', [Validators.required, Validators.minLength(6)]),
      role: new FormControl('Capo Cantiere', Validators.required)
    });
  }

  onNoClick(): void {
    this.dialogRef.close("test value");
  }

  onConfirm(): void {
    if (this.createUserForm.valid) {
      this.dialogRef.close(this.createUserForm.value);
    }
  }
}

import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { HomeGestioneComponent } from '../home-gestione/home-gestione.component';
import { CommonModule } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';


@Component({
  selector: 'app-utenti-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatOptionModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogContent,
    MatDialogActions,
  ],
  templateUrl: './utenti-create-dialog.component.html',
  styleUrl: './utenti-create-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtentiCreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<HomeGestioneComponent>);
  createUserForm: FormGroup;
  formError: string = "";
  roles: string[] = ["Admin", "Capo Cantiere", "Responsabile"];

  constructor(){
    this.createUserForm = new FormGroup({
      name: new FormControl('', Validators.required),
      surname: new FormControl('', Validators.required),
      username: new FormControl('', [Validators.required, Validators.pattern(/\./)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      role: new FormControl('', Validators.required)
    });
  }

  onNoClick(): void {
    this.dialogRef.close("test value");
  }

  onConfirm(): void {
    console.log('this.createUserForm.valid: ', this.createUserForm.valid);
    if (this.createUserForm.valid) {
      this.dialogRef.close(this.createUserForm.value);
      this.formError = "";
    }else{
      this.formError = "Informazioni non valide";
    }
  }
}

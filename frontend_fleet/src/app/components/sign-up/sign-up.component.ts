import { CommonModule } from '@angular/common';
import { MatInputModule} from '@angular/material/input';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUpComponent {
  signupForm!: FormGroup;

  constructor() {
    this.signupForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.maxLength(12)]), // aggiungi il controllo username
      email: new FormControl('', [Validators.required, Validators.email]), // aggiungi il controllo email
      password: new FormControl('', [Validators.required]) // aggiungi il controllo password
    });
  }

  signUp(){

  }
}

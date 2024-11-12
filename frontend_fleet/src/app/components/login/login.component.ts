import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  loginForm!: FormGroup;

  constructor(private router: Router) {
    this.loginForm = new FormGroup({
      usernameOremail: new FormControl('', [Validators.required, Validators.maxLength(12)]), // aggiungi il controllo username
      password: new FormControl('', [Validators.required]) // aggiungi il controllo password
    });
  }

  login(){
    this.router.navigate(['dashboard']);
  }
}

import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
import { LoginService } from '../../Common-services/login/login.service';

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

  constructor(
    private router: Router,
    private sessionStorageService: SessionStorageService,
    private loginService: LoginService
  ) {
    this.loginForm = new FormGroup({
      usernameOremail: new FormControl('', [Validators.required, Validators.maxLength(12)]), //  controllo username
      password: new FormControl('', [Validators.required]) // controllo password
    });
  }

  login(){
    if(this.loginForm.valid){
      this.sessionStorageService.setItem("user", this.loginForm.get('usernameOremail')?.value);
      this.loginService.login$.next(); //notifica del login
      this.router.navigate(['dashboard']); //navigazione alla pagina principale
    }

  }
}

import { CommonModule } from '@angular/common';
import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, signal} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
import { LoginService } from '../../Common-services/login service/login.service';
import { CookiesService } from '../../Common-services/cookies service/cookies.service';
import { Subject, takeUntil } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent{
  private readonly destroy$: Subject<void> = new Subject<void>();
  loginError: boolean = false;
  loginForm!: FormGroup;

  isCapsActive: boolean = false;

  constructor(
    private router: Router,
    private cookiesService: CookiesService,
    private loginService: LoginService,
    private cd: ChangeDetectorRef
  ) {
    this.loginForm = new FormGroup({
      username: new FormControl('', [
        Validators.required
      ]),
      password: new FormControl('', [
        Validators.required
      ])
    });

  }

  login(){
    if(this.loginForm.valid){
      this.loginService.login(this.loginForm.value).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cookiesService.setCookie("user", response.access_token);
          this.loginService.login$.next();
          this.router.navigate(['/dashboard']);
        },
        error: error => {
          console.error("Errore nel login: ", error);
          this.loginError = true;
          this.cd.detectChanges();
        }
      });
      // this.router.navigate(['dashboard']); //navigazione alla pagina principale
    }
  }

  checkCapslock(event: KeyboardEvent): void {
    this.isCapsActive = event.getModifierState('CapsLock');
  }
}

import { CommonModule } from '@angular/common';
import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../Common-services/login service/login.service';
import { CookiesService } from '../../Common-services/cookies service/cookies.service';
import { count, Subject, takeUntil } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

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
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  credentialsError: boolean = false;
  credentialsWarning: boolean = false;
  loginSuccess: boolean = false;

  loginForm!: FormGroup;

  isCapsActive: boolean = false;

  maxAttempts: number = 3; //tentativi massimi prima dell'inizio dei timeout
  maxTimeoutTime: number = 90; //tempo massimo di timeout

  showPassword: boolean = false;

  attempts: number = 0;
  timeoutTime: number = 0;
  timeoutCountdown: number = 1;

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.attempts = parseInt(this.cookiesService.getCookie("attempts")) || 0;
    this.timeoutTime = parseInt(this.cookiesService.getCookie("timeoutTime")) || 0;
  }

  ngAfterViewInit(): void {
    this.attempts = parseInt(this.cookiesService.getCookie("attempts")) || 0;
    this.timeoutTime = parseInt(this.cookiesService.getCookie("timeoutTime")) || 0;
    const currentTimeout = parseInt(this.cookiesService.getCookie('currentTimeout'));

    if(currentTimeout){
      // this.setBlockingCountdown(currentTimeout);
    }

    this.credentialsWarning = this.checkLastAttempt(this.attempts);
    this.cd.detectChanges();
  }

  /**
   * Effettua e gestisce gli errori di login
   */
  login(){
    if(this.loginForm.valid){
      this.loginService.login(this.loginForm.value).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cookiesService.setCookie("user", response.access_token);
          this.deleteCookies();
          this.loginSuccess = true;
          this.attempts = 0;
          this.cd.detectChanges();
          setTimeout(() => {
            this.loginService.login$.next();
            this.router.navigate(['/dashboard']);
          }, 3000);
        },
        error: error => {
          this.attempts++;
          this.cookiesService.setCookie("attempts", this.attempts.toString());

          if(this.credentialsWarning){
            this.credentialsWarning = false;
          }
          if(this.attempts == this.maxAttempts){
            this.credentialsWarning = true;
          }
          this.cd.detectChanges();

          if(this.attempts <= this.maxAttempts){
            this.showCredentialsError(2000); //mostra errore credenziali
          }else{
            this.timeoutUser(); //metti l'utente in timeout
          }
        }
      });
    }
  }

  /**
   * Mostra l'errore delle credenziali
   * @param mills millisecondi per i quali deve essere mostrato l'errore
   */
  showCredentialsError(mills: number){
    this.credentialsError = true; //mostra errore di credenziali
    this.cd.detectChanges();
    setTimeout(() => {
      this.credentialsError = false; //nascondi errore credenziali
      this.cd.detectChanges();
    }, mills);
  }

  /**
   * Mette l'utente in timeout
   */
  timeoutUser() {
    this.timeoutTime += 30000; //incremento della durata del timer di 30 secondi
    this.cookiesService.setCookie("timeoutTime", this.timeoutTime.toString());

    //se il tempo calcolato è più del tempo massimo di timeout, imposta timeout a tempo massimo
    this.timeoutTime > this.maxTimeoutTime * 1000 ? this.timeoutCountdown = this.maxTimeoutTime * 1000 : this.timeoutCountdown = this.timeoutTime;
    this.setBlockingCountdown(this.timeoutCountdown);//imposta countdown di blocco
  }

  /**
   * Imposta il timeout bloccante e lo visualizza
   * @param countdown secondi per il timer
   */
  private setBlockingCountdown(countdown: number){
    this.credentialsError = true; //mostra errore credenziali
    this.timeoutCountdown = countdown;

    const timer = setInterval(() => {
      this.timeoutCountdown -= 1000; //decremento del countdown di 1 secondo

      this.cookiesService.setCookie("currentTimeout", this.timeoutCountdown.toString());
      this.cd.detectChanges();

      if (this.timeoutCountdown <= 0) {
        clearInterval(timer); //blocca il timer una volta finito

        this.cookiesService.deleteCookie("currentTimeout");
        this.credentialsError = false;//nascondi errore credenziali

        this.cd.detectChanges();
      }
    }, 1000);
  }

  private checkLastAttempt(attempts: number){
    if(attempts == this.maxAttempts){
      return true;
    }
    return false;
  }

  private deleteCookies(){
    this.cookiesService.deleteCookie("timeoutTime");
    this.cookiesService.deleteCookie("attempts");
    this.cookiesService.deleteCookie("currentTimeout");
  }

  /**
   * Controlla se il caps lock è attivo alla pressione di un tasto mentre ci si trova in un campo di input di testo
   * @param event evento
   */
  checkCapslock(event: KeyboardEvent): void {
    this.isCapsActive = event.getModifierState('CapsLock');
  }
}

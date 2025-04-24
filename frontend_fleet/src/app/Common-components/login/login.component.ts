import { CommonModule } from '@angular/common';
import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../Common-services/login service/login.service';
import { Subject, takeUntil } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
import { CookieService } from 'ngx-cookie-service';
import { WebsocketService } from '../../Common-services/websocket/websocket.service';
import { MapService } from '../../Common-services/map/map.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush
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
    private cookieService: CookieService,
    private loginService: LoginService,
    private sessionStorageService: SessionStorageService,
    private webSocketService: WebsocketService,
    private mapService: MapService,
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
    this.attempts = parseInt(this.cookieService.get("attempts")) || 0;
    this.timeoutTime = parseInt(this.cookieService.get("timeoutTime")) || 0;
  }

  ngAfterViewInit(): void {
    this.attempts = parseInt(this.cookieService.get("attempts")) || 0;
    this.timeoutTime = parseInt(this.cookieService.get("timeoutTime")) || 0;
    const currentTimeout = parseInt(this.cookieService.get('currentTimeout'));

    if(currentTimeout){
      this.setBlockingCountdown(currentTimeout);
    }

    this.credentialsWarning = this.checkLastAttempt(this.attempts);
    this.cd.detectChanges();
  }

  /**
   * Effettua e gestisce gli errori di login
   */
  login() {
    if (this.loginForm.valid) {
      this.loginService.login(this.loginForm.value).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.sessionStorageService.setItem("dashboard-section", "table");
            this.cookieService.set("user", response.access_token);
            this.deleteCookies();
            this.loginSuccess = true;
            this.attempts = 0;
            this.cd.detectChanges();

            this.webSocketService.connectToWebSocket(response.access_token); //connessione al websocket

            setTimeout(() => {
              this.loginService.login$.next();
              this.router.navigate(['/dashboard']).then(() => {
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize')); //resizing dell'interfaccia per evitare il sovrapponimento della sidebar
                  this.mapService.initMap$.next({point: this.mapService.defaultPoint, zoom: this.mapService.defaultZoom}); //inizializzazione della mappa dopo il resizing
                  this.cd.detectChanges();
                }, 100);
              });
            }, 3000);
          },
          error: (error) => {
            console.error("Errore nel login: ", error);
            this.attempts++;
            this.cookieService.set("attempts", this.attempts.toString());

            if (this.credentialsWarning) {
              this.credentialsWarning = false;
            }
            if (this.attempts == this.maxAttempts) {
              this.credentialsWarning = true;
            }
            this.cd.detectChanges();

            if (this.attempts <= this.maxAttempts) {
              this.showCredentialsError(2000);
            } else {
              this.timeoutUser();
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
    this.cookieService.set("timeoutTime", this.timeoutTime.toString());

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

      this.cookieService.set("currentTimeout", this.timeoutCountdown.toString());
      this.cd.detectChanges();

      if (this.timeoutCountdown <= 0) {
        clearInterval(timer); //blocca il timer una volta finito

        this.cookieService.delete("currentTimeout");
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

  /**
   * Elimina i cookies salvati
   */
  private deleteCookies(){
    this.cookieService.delete("timeoutTime");
    this.cookieService.delete("attempts");
    this.cookieService.delete("currentTimeout");
  }

  /**
   * Controlla se il caps lock è attivo alla pressione di un tasto mentre ci si trova in un campo di input di testo
   * @param event evento
   */
  checkCapslock(event: KeyboardEvent): void {
    if (event instanceof KeyboardEvent) {
      this.isCapsActive = event.getModifierState && event.getModifierState('CapsLock');
    }
  }

}

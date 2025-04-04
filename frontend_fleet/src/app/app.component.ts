import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { NavbarComponent } from './Common-components/navbar/navbar.component';
import { MatButtonModule } from '@angular/material/button';
import { LoginService } from './Common-services/login service/login.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationService } from './Common-services/navigation/navigation.service';
import { SessionStorageService } from './Common-services/sessionStorage/session-storage.service';
import { AuthService } from './Common-services/auth/auth.service';
import { CookieService } from 'ngx-cookie-service';

import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import * as moment from 'moment';
import 'moment/locale/it';
import { MY_DATE_FORMATS } from './Utils/date-format';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { LoginComponent } from "./Common-components/login/login.component";
import { WebsocketService } from './Common-services/websocket/websocket.service';
import { NotificationService } from './Common-services/notification/notification.service';
import { Notifica } from './Models/Notifica';
import { User } from './Models/User';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    MatSidenavModule,
    MatMenuModule,
    MatToolbarModule,
    LoginComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'it-IT' }
  ],
  animations: [
    trigger('rotatedState', [
      state('default', style({ transform: 'rotate(0)' })),
      state('rotated', style({ transform: 'rotate(-360deg)' })),
      transition('rotated => default', animate('500ms ease-out')),
      transition('default => rotated', animate('500ms ease-in')),
    ]),
  ],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('drawer') drawer!: MatDrawer; //sidebar mobile
  @ViewChild('fixedDrawer') fixedDrawer!: MatDrawer; //sidebar fissa

  selectedBtn: string = "dashboard";
  isLoginPage: boolean = true;
  isLogged: boolean = true;
  isGestioneOpen: boolean = false;

  notifiche: Notifica[] = [];

  title = 'frontend_fleet';
  user!: any;

  logoutButtonAnimationState = 'default';

  constructor(
    public router: Router,
    private loginService: LoginService,
    private cookieService: CookieService,
    private authService: AuthService,
    private ngZone: NgZone,
    private notificationService: NotificationService,
    private webSocketService: WebsocketService,
    private navigationService: NavigationService, //servizio importato per farlo caricare ad inizio applicazione
    private cd: ChangeDetectorRef
  ){
    moment.locale('it');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cookieService.delete("user");
  }

  ngAfterViewInit(): void {
    this.authService.getUserInfo().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: User) => {
        this.user = user;
        this.isLogged = true;
        this.isLoginPage = this.checkLoginPage(this.router.url);

        this.cd.detectChanges();
      },
      error: error => console.error("Errore nella ricezione dei dat dell'utente: ", error)
    });

    //sottoscrizione al login
    this.loginService.login$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const current_token = this.cookieService.get("user");
        this.user = this.authService.decodeToken(current_token);
        this.ngZone.run(() => {
          this.isLogged = true;
          this.isLoginPage = false;
        });
        this.getToReadNotification();
        this.cd.detectChanges();
      },
      error: (error) => console.error("Error logging in: ", error),
    });
    this.getToReadNotification();
    this.cd.detectChanges();
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isLoginPage = this.checkLoginPage(event.urlAfterRedirects);
      if(this.drawer.opened)
        this.drawer.close();
      if(this.router.url == "/login"){
        //chiusura della sidebar in caso sia aperta mentre l'utente si trova nella pagina di login
        if(this.drawer.opened){
          this.drawer.close();
        }
        this.isLogged = false;
      }
    });

    //connessione al canale per l'avviso in tempo reale delle notifiche
    this.webSocketService.getNotifyMessages().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (notification: Notifica) => {
        if (notification) {
          if (!Array.isArray(this.notifiche))
            this.notifiche = [];

          this.notifiche.unshift(notification);
        } else {
          console.error('Notifica ricevuta è null o undefined');
        }
      },
      error: error => console.error("Errore nella ricezione della notifica: ", error)
    });
  }

  getToReadNotification(){
    //ottenimento delle notifiche da leggere
    this.notificationService.getToReadNotifications()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (notifiche: Notifica[]) => {
        this.notifiche = notifiche;
      },
      error: (error) => console.error("Errore nell'ottenimento delle notifiche da leggere: ", error),
    });
  }

  /**
   * richiama la funzion nel servizio per effettuare il logout e naviga alla pagina di login
   */
  logout(){
    this.loginService.logout();
    this.user = null;
    this.router.navigate(['/login']);
  }

  /**
   * Gestisce la chisura e l'apertura dinamica delle sidebar fissa e mobile
   */
  toggleDrawers() {
    if (this.fixedDrawer.opened) {
      // Se il fixedDrawer è aperto, chiudilo e apri il drawer normale
      this.fixedDrawer.close();
      setTimeout(() => {
        this.drawer.open();
      }, 300); // Delay per evitare conflitti visivi
    } else if (this.drawer.opened) {
      // Se il drawer normale è aperto, chiudilo e apri il fixedDrawer
      this.drawer.close();
      setTimeout(() => {
        this.fixedDrawer.open();
      }, 300);
    } else {
      // Se entrambi sono chiusi, apri il fixedDrawer per default
      this.fixedDrawer.open();
    }
  }

  /**
   * Controlla se la pagina attuale è quella di login
   * @param url url da controllare
   * @returns true se è l'url è /login, altrimenti false
   */
  checkLoginPage(url: string): boolean {
    return url === '/login';
  }

  /**
   * Permette di modificare lo stato dell'animazione del bottone di logout
   * @param state stato alla quale si vuole
   */
  triggerLogoutButtonAnimation(state: string): void {
    this.logoutButtonAnimationState = state;
  }
}

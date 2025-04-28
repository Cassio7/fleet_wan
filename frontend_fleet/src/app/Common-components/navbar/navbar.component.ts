import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { filter, merge, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../Common-services/auth/auth.service';
import { LoginService } from '../../Common-services/login service/login.service';
import { NotificationService } from '../../Common-services/notification/notification.service';
import { KanbanAntennaService } from '../../Dashboard/Services/kanban-antenna/kanban-antenna.service';
import { KanbanGpsService } from '../../Dashboard/Services/kanban-gps/kanban-gps.service';
import { KanbanSessioneService } from '../../Dashboard/Services/kanban-sessione/kanban-sessione.service';
import { KanbanTableService } from '../../Dashboard/Services/kanban-table/kanban-table.service';
import { Notifica } from '../../Models/Notifica';
import { User } from '../../Models/User';
import { ProfileService } from '../../Profile/Services/profile/profile.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatBadgeModule,
    MatDividerModule,
    RouterModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  currentPage: string = '';
  icon: string = '';
  name: string = "";
  surname: string = "";
  role: string = "";

  @Input() notifiche: Notifica[] = [];

  user!: User;
  isKanban: boolean = false;

  constructor(
    private loginService: LoginService,
    private authService: AuthService,
    private kanbanAntennaService: KanbanAntennaService,
    private kanbanGpsService: KanbanGpsService,
    private kanbanSessioneService: KanbanSessioneService,
    private kanabanTableService: KanbanTableService,
    private profileService: ProfileService,
    private notificationService: NotificationService,
    private cookieService: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.updateNavbarIcon(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateNavbarIcon(event.url);
      this.isKanban = false;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const access_token = this.cookieService.get("user");
      if(access_token){
        this.user = this.authService.decodeToken(access_token);
        merge(
          this.kanbanAntennaService.loadKanbanAntenna$.pipe(takeUntil(this.destroy$)),
          this.kanbanGpsService.loadKanbanGps$.pipe(takeUntil(this.destroy$)),
          this.kanbanSessioneService.loadKanbanSessione$.pipe(takeUntil(this.destroy$))
        ).subscribe({
          next: () => {
            this.isKanban = true;
            this.cd.detectChanges();
          },
          error: error => console.error("Errore nel cambio del path: ", error)
        });
        this.kanabanTableService.loadKabanTable$.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.currentPage = "dashboard";
            this.isKanban = false;
            this.cd.detectChanges();
          },
          error: error => console.error("Errore nel cambio del path: ", error)
        });
        this.cd.detectChanges();
      }
    });
    this.handleProfileInfoUpdate();
  }

  private updateNavbarIcon(url: string): void {
    const match = url.match(/\/profile\/[^\/]+/);

    if (match) {
      this.currentPage = match[0];
    } else {
      this.currentPage = url;
    }

    switch (this.currentPage) {
      case '/dashboard':
        this.icon = "dashboard";
        break;
      case '/home-mezzi':
        this.icon = "local_shipping";
        break;
      case '/storico-mezzi':
        this.icon = "inventory_2";
        break;
      case "/home-mappa":
        this.icon = "map";
        break;
      case "/gestione-utenti":
        this.icon = "manage_accounts";
        break;
      case "/gestione-veicoli":
        this.icon = "local_shipping";
        break;
      case "/gestione-cantieri":
        this.icon = "location_city";
        break;
      case "/gestione-societa":
        this.icon = "business";
        break;
      case "/scarico-letture":
        this.icon = "download";
          break;
      case "/profile":
        this.icon = "account_circle";
        break;
      case "/notifications":
        this.icon = "notifications";
        break;
      case "/404-notFound":
        this.icon = "search_off";
        break;
      default:
        if(this.currentPage.includes("/dettaglio")){
          this.icon = "local_shipping";
        }else{
          this.icon = "search_off";
        }
    }

    this.cd.detectChanges();
  }

  handleProfileInfoUpdate(){
    this.profileService.updateUserData$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: User | null) => {
        if(user){
          this.user = user;
          const { name, surname } = user;
          if(name) this.name = name;
          if(surname) this.surname = surname;
        }
      },
      error: error => console.error("Errore nell'aggiornamento dei nuovi dati dell'utente nella navbar: ", error)
    });
  }

  updateNotification(notification: Notifica, event: Event){
    event.stopPropagation();
    this.notificationService.updateNotificationReadStatus(notification.key)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: { notification: Notifica, message: string }) => {
        const { notification: updatedNotification } = response;
        const index = this.notifiche.findIndex(
          notif => notif.key === updatedNotification.key
        );
        if (index !== -1) {
          this.notifiche[index].isRead = updatedNotification.isRead;
        }
        this.notificationService.updatedNotification$.next(updatedNotification);
      },
      error: error => {
        console.error("Errore nell'aggiornamento della notifica: ", error);
      }
    });
  }

  isNotificationPage(): boolean{
    return this.router.url == "/notifications";
  }


  showProfile(){
    this.router.navigate(["/profile"]);
  }

  logout(){
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}

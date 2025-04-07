import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, merge, takeUntil } from 'rxjs';
import { LoginService } from '../../Common-services/login service/login.service';
import { AuthService } from '../../Common-services/auth/auth.service';
import { KanbanAntennaService } from '../../Dashboard/Services/kanban-antenna/kanban-antenna.service';
import { KanbanGpsService } from '../../Dashboard/Services/kanban-gps/kanban-gps.service';
import { KanbanTableService } from '../../Dashboard/Services/kanban-table/kanban-table.service';
import { CommonModule } from '@angular/common';
import { User } from '../../Models/User';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
import { ProfileService } from '../../Profile/Services/profile/profile.service';
import { KanbanSessioneService } from '../../Dashboard/Services/kanban-sessione/kanban-sessione.service';
import { MatDividerModule } from '@angular/material/divider';
import { WebsocketService } from '../../Common-services/websocket/websocket.service';
import { MatBadgeModule } from '@angular/material/badge';
import { Notifica } from '../../Models/Notifica';
import { CookieService } from 'ngx-cookie-service';

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
  @Output() getNotifications: EventEmitter<Notifica[]> = new EventEmitter<Notifica[]>();

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
      case "/profile":
        this.icon = "account_circle";
        break;
      default:
        this.icon = "dashboard";
    }

    this.cd.detectChanges();
  }



  ngAfterViewInit(): void {
    setTimeout(() => {
      const access_token = this.cookieService.get("user");
      if(access_token){
        this.user = this.authService.decodeToken(access_token);
        console.log('user from token: ', this.user);
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


  showProfile(){
    this.router.navigate(["/profile"]);
  }

  logout(){
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}

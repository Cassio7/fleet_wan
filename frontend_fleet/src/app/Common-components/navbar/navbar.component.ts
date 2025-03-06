import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, merge, takeUntil } from 'rxjs';
import { LoginService } from '../../Common-services/login service/login.service';
import { CookiesService } from '../../Common-services/cookies service/cookies.service';
import { AuthService } from '../../Common-services/auth/auth.service';
import { KanbanAntennaService } from '../../Dashboard/Services/kanban-antenna/kanban-antenna.service';
import { KanbanGpsService } from '../../Dashboard/Services/kanban-gps/kanban-gps.service';
import { KanbanTableService } from '../../Dashboard/Services/kanban-table/kanban-table.service';
import { CommonModule } from '@angular/common';
import { User } from '../../Models/User';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
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
    RouterModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  currentPage: string = '';
  isKanban: boolean = false;
  icon: string = '';
  name: string = "";
  surname: string = "";
  role: string = "";

  constructor(
    private loginService: LoginService,
    private cookieService: CookiesService,
    private authService: AuthService,
    private kanbanAntennaService: KanbanAntennaService,
    private kanbanGpsService: KanbanGpsService,
    private kanabanTableService: KanbanTableService,
    private activatedRoute: ActivatedRoute,
    private profileService: ProfileService,
    private sessionStorageService: SessionStorageService,
    private router: Router,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.updateNavbarState(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateNavbarState(event.url);
    });
  }

  private updateNavbarState(url: string): void {
    const regex = /\/dettaglio-mezzo\/(\d+)/;
    const match = url.match(regex);

    if (match) {
      const id = match[1];
      this.currentPage = `Dettaglio Mezzo/${id}`;
      this.isKanban = false;
      this.icon = "directions_car";
    } else {
      switch (url) {
        case '/dashboard':
          this.currentPage = "Riepilogo";
          this.isKanban = false;
          this.icon = "dashboard";
          const dashboardSection = this.sessionStorageService.getItem("dashboard-section");
          if(dashboardSection){
            switch(dashboardSection){
              case 'table':
                this.isKanban = false;
                break;
              case 'GPS':
                this.isKanban = true;
                break;
              case 'Antenna':
                this.isKanban = true;
                break;
              case 'Sessione':
                this.isKanban = true;
                break;
            }
          }
          break;
        case '/home-mezzi':
          this.currentPage = "Parco mezzi";
          this.isKanban = false;
          this.icon = "local_shipping";
          break;
        case '/storico-mezzi':
          this.currentPage = "Storico mezzi";
          this.isKanban = false;
          this.icon = "inventory_2";
          break;
        case "/home-mappa":
          this.currentPage = "Mappa";
          this.isKanban = false;
          this.icon = "map";
          break;
        case "/profile":
          this.currentPage = "profilo";
          this.isKanban = false;
          this.icon = "account_circle";
          break;
        default:
          this.currentPage = "Riepilogo";
          this.isKanban = true;
          this.icon = "dashboard";
      }
    }
    this.cd.detectChanges();
  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      this.authService.getUserInfo().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.name = user.name;
          this.surname = user.surname;
          this.role = user.role;
          this.cd.detectChanges();
        },
        error: error => console.error("Errore nella ricezione dei dat dell'utente: ", error)
      });
      merge(
        this.kanbanAntennaService.loadKanbanAntenna$.pipe(takeUntil(this.destroy$)),
        this.kanbanGpsService.loadKanbanGps$.pipe(takeUntil(this.destroy$))
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
          this.currentPage = "Riepilogo";
          this.isKanban = false;
          this.cd.detectChanges();
        },
        error: error => console.error("Errore nel cambio del path: ", error)
      });
      this.cd.detectChanges();
    });


  }

  handleProfileInfoUpdate(){
    this.profileService.updateUserData$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: User | null) => {
        if(user){
          const { name, surname } = user;
          if(name) this.name = name;
          if(surname) this.surname = surname;
        }
        console.log("me so arivati sti dati: ", user)
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

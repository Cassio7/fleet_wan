import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, merge, takeUntil } from 'rxjs';
import { CommonService } from '../../Common-services/common service/common.service';
import { LoginService } from '../../Common-services/login service/login.service';
import { CookiesService } from '../../Common-services/cookies service/cookies.service';
import { AuthService } from '../../Common-services/auth/auth.service';
import { KanbanAntennaService } from '../../Dashboard/Services/kanban-antenna/kanban-antenna.service';
import { KanbanGpsService } from '../../Dashboard/Services/kanban-gps/kanban-gps.service';
import { KanbanTableService } from '../../Dashboard/Services/kanban-table/kanban-table.service';
import { CommonModule } from '@angular/common';
import { User } from '../../Models/User';

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
    private router: Router,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
  this.router.events.pipe(
    filter(event => event instanceof NavigationEnd)
  ).subscribe(() => {
    const url = this.router.url;
    console.log('URL corrente:', url);

    // Gestisci il caso di /dettaglio-mezzo/:id
    const regex = /\/dettaglio-mezzo\/(\d+)/;
    const match = url.match(regex);

    if (match) {
      const id = match[1]; // Estrai l'id dalla URL
      this.currentPage = `Dettaglio Mezzo/${id}`;
      this.isKanban = false;
      this.icon = "directions_car";
    } else {
      switch (url) {
        case '/dashboard':
          this.currentPage = "Riepilogo";
          this.isKanban = true;
          this.icon = "dashboard";
          break;
        case '/home-mezzi':
          this.currentPage = "Parco mezzi";
          this.isKanban = false;
          this.icon = "local_shipping";
          break;
        case '/storico-mezzi':
          this.currentPage = "Storico mezzi"
          this.icon = "inventory_2"
          break;
        default:
          this.currentPage = "Dashboard";
          this.isKanban = true;
          this.icon = "dashboard";
      }
    }

    this.cd.detectChanges(); // Assicurati che la vista si aggiorni
  });
}


  ngAfterViewInit(): void {
    this.cd.detectChanges();
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
        this.currentPage = "Dashboard";
        this.isKanban = false;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel cambio del path: ", error)
    });
    this.cd.detectChanges();
  }

  logout(){
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}

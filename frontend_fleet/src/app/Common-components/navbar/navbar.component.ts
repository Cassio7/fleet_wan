import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
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
  username: string = "";
  role: string = "";

  constructor(
    private loginService: LoginService,
    private cookieService: CookiesService,
    private authService: AuthService,
    private kanbanAntennaService: KanbanAntennaService,
    private kanbanGpsService: KanbanGpsService,
    private kanabanTableService: KanbanTableService,
    private router: Router,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(()=>{
      const url = this.router.url;
      switch(url){
        case '/dashboard':
          this.currentPage = "Dashboard";
          this.icon = "dashboard";
          break;
        case '/home-mezzi':
          this.currentPage = "Parco mezzi";
          this.icon = "local_shipping";
          break;
        default:
          this.currentPage = "Dashboard";
          this.icon = "dashboard";
      }
    });
  }

  ngAfterViewInit(): void {
    const access_token = this.cookieService.getCookie("user");
    const userInfo: User = this.authService.decodeToken(access_token);
    this.username = userInfo.username;
    switch(userInfo.role){
      case 1:
        this.role = "Admin";
        break;
    }
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

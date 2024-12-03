import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from "./Common-components/footer/footer.component";
import { filter, Subject, takeUntil } from 'rxjs';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { NavbarComponent } from './Common-components/navbar/navbar.component';
import { MatButtonModule } from '@angular/material/button';
import { LoginService } from './Common-services/login service/login.service';
import { CommonModule } from '@angular/common';
import { SessionStorageService } from './Common-services/sessionStorage/session-storage.service';
import { CookiesService } from './Common-services/cookies service/cookies.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FooterComponent,
    MatIcon,
    MatButtonModule,
    NavbarComponent,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild('drawer') drawer!: MatDrawer;
  isLogged = false;
  title = 'frontend_fleet';
  private readonly destroy$: Subject<void> = new Subject<void>();


  constructor(
    private router: Router,
    private loginService: LoginService,
    private cookiesService: CookiesService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cookiesService.deleteCookie("user");
  }

  ngAfterViewInit(): void {
    const user = this.cookiesService.getCookie("user");

    user ? this.isLogged=true : this.isLogged=false; //se è stato impostato l'user

    //sottoscrizione al login
    this.loginService.login$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.isLogged = true;
      },
      error: error => console.error("Error logging in: ", error)
    });
    //sottoscrizione a router per i cambiamenti di pagina
    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(()=>{
      if(this.router.url == "/login"){
        this.isLogged = false;
      }
    });
    this.cd.detectChanges();
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setBackgroundImage(event.urlAfterRedirects);
    });
  }


  setBackgroundImage(url: string): void {
    const body = document.body;
    if (url === '/login') {
      body.classList.add('bg-image');
    } else {
      body.classList.remove('bg-image');
    }
  }
}

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
import { User } from './Models/User';
import { AuthService } from './Common-services/auth/auth.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    // FooterComponent,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    MatSidenavModule,
    MatMenuModule,
    MatToolbarModule
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild('drawer') drawer!: MatDrawer; //sidebar mobile
  @ViewChild('fixedDrawer') fixedDrawer!: MatDrawer; //sidebar fissa

  selectedBtn: string = "dashboard";
  isLoginPage = true;
  isLogged = false;
  title = 'frontend_fleet';
  user!: any;
  private readonly destroy$: Subject<void> = new Subject<void>();


  constructor(
    public router: Router,
    private loginService: LoginService,
    private cookieService: CookieService,
    private authService: AuthService,
    private sessionStorageService: SessionStorageService,
    private ngZone: NgZone,
    private navigationService: NavigationService, //servizio importato per farlo caricare ad inizio applicazione
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cookieService.delete("user");
  }

  ngAfterViewInit(): void {
    const access_token = this.cookieService.get("user");
    access_token ? this.isLogged=true : this.isLogged=false; //se è stato impostato l'user
    this.user = this.authService.decodeToken(access_token);

    //se non loggato, redirect a login
    if(access_token){
      this.isLogged = true;
    }else{
      this.isLogged = false;
      this.router.navigate(['/login']);
    }
    //sottoscrizione al login
    this.loginService.login$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const current_token = this.cookieService.get("user");
        this.user = this.authService.decodeToken(current_token);
        this.ngZone.run(() => {
          this.isLogged = true;
          this.isLoginPage = false;
        });
        this.cd.detectChanges();
      },
      error: (error) => console.error("Error logging in: ", error),
    });
    this.cd.detectChanges();
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isLoginPage = this.checkLoginPage(event.urlAfterRedirects);
      if(this.drawer.opened)
        this.drawer.toggle();
      if(this.router.url == "/login"){
        //chiusura della sidebar in caso sia aperta mentre l'utente si trova nella pagina di login
        if(this.drawer.opened){
          this.drawer.toggle();
        }
        this.isLogged = false;
      }
    });
  }

  logout(){
    this.loginService.logout();
    this.user = null;
    this.router.navigate(['/login']);
  }

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
}

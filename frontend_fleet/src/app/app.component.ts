import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { FooterComponent } from "./Common-components/footer/footer.component";
import { filter, Subject, takeUntil } from 'rxjs';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { NavbarComponent } from './Common-components/navbar/navbar.component';
import { MatButtonModule } from '@angular/material/button';
import { LoginService } from './Common-services/login service/login.service';
import { CommonModule } from '@angular/common';
import { CookiesService } from './Common-services/cookies service/cookies.service';
import { MatMenuModule } from '@angular/material/menu';

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
  //botti dentro sidebar fissa
  @ViewChild('dashboardBtn') dashboardBtn!: ElementRef;
  @ViewChild('mezziBtn') mezziBtn!: ElementRef;

  @ViewChild('drawer') drawer!: MatDrawer; //sidebar mobile

  isLoginPage = true;
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

    //se non loggato, redirect a login
    if(user){
      this.isLogged = true;
    }else{
      this.isLogged = false;
      this.router.navigate(['/login']);
    }
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
        //chiusura della sidebar in caso sia aperta mentre l'utente si trova nella pagina di login
        if(this.drawer.opened){
          this.drawer.toggle();
        }
        this.isLogged = false;
      }
    });
    this.cd.detectChanges();

    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      const url = this.router.url;
      switch (url) {
        case '/dashboard':
          this.dashboardBtn.nativeElement.style.borderLeft = '5px solid #FFF';
          this.removeButtonsSelection("dashboard");
          break;
        case '/home-mezzi':
          this.mezziBtn.nativeElement.style.borderLeft = '5px solid #FFF';
          this.removeButtonsSelection("mezzi");
          break;
        default:
          this.dashboardBtn.nativeElement.style.borderLeft = '5px solid #FFF';
      }
      this.cd.detectChanges();
    });
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setBackgroundImage(event.urlAfterRedirects);
    });
  }

  /**
   * Rimuove la selezione di tutti i bottoni a parte quello selezionato
   * @param selectedButton label del bottone selezionato
   */
  removeButtonsSelection(selectedButton: string){
    switch(selectedButton){
      case "dashboard":
      this.mezziBtn.nativeElement.style.borderLeft = "transparent";
      break;
      case "mezzi":
      this.dashboardBtn.nativeElement.style.borderLeft = "transparent";
      break;
    }
  }

  logout(){
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  setBackgroundImage(url: string): void {
    const body = document.body;
    if (url === '/login') {
      this.isLoginPage = true;
      body.classList.add('bg-image');
    } else {
      this.isLoginPage = false;
      body.classList.remove('bg-image');
    }
    this.cd.detectChanges();
  }
}

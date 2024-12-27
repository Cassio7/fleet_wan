import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter } from 'rxjs';
import { CommonService } from '../../Common-services/common service/common.service';
import { LoginService } from '../../Common-services/login service/login.service';
import { CookiesService } from '../../Common-services/cookies service/cookies.service';
import { AuthService } from '../../Common-services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
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
export class NavbarComponent implements OnInit, AfterViewInit{
  currentPage: string = '';
  icon: string = '';
  username: string = "";
  role: string = "";

  constructor(
    private loginService: LoginService,
    private cookieService: CookiesService,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ){}

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
    const access_token_raw = this.cookieService.getCookie("user");
    const access_token = this.authService.decodeToken(access_token_raw);
    this.username = access_token.username;
    switch(access_token.role){
      case 1:
        this.role = "Admin";
        break;
    }
    this.cd.detectChanges();
  }

  logout(){
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}

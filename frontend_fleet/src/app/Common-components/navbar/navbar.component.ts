import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter } from 'rxjs';
import { CommonService } from '../../Common-services/common service/common.service';

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
export class NavbarComponent implements OnInit{
  currentPage: string = '';
  icon: string = '';
  constructor(
    private commonService: CommonService,
    private router: Router
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
          this.currentPage = "Mezzi";
          this.icon = "local_shipping";
          break;
        default:
          this.currentPage = "Dashboard";
          this.icon = "dashboard";
      }
    });
  }

  logout(){
    localStorage.removeItem("user");
    this.router.navigate(['/login']);
  }
}

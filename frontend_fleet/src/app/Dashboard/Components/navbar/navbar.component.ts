import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { CommonService } from '../../../Common services/common service/common.service';

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
export class NavbarComponent {

  constructor(
    private commonService: CommonService,
    private router: Router
  ){}

  notifySidebar(){
    this.commonService.notifySidebar$.next();
  }

  logout(){
    localStorage.removeItem("user");
    this.router.navigate(['/login']);
  }
}

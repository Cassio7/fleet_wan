import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NavbarComponent } from "../navbar/navbar.component";
import { Router } from '@angular/router';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { CommonService } from '../../services/common service/common.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDrawer,
    MatDrawerContainer,
    NavbarComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class HomeComponent implements AfterViewInit{
  @ViewChild('drawer') sidebar!: MatDrawer;
  showFiller: boolean = false;
  constructor(
    private commonService: CommonService,
    private router: Router
  ){}

  ngAfterViewInit(): void {
    this.commonService.notifySidebar$.subscribe({
      next: () => {
        this.sidebar.toggle();
      },
      error: () => {
        console.error("Error opening the sidebar.");
      }
    })
  }

  workingCardClick(){
    this.router.navigate(['working-vehicles']);
  }

  brokenCardClick(){
    this.router.navigate(['broken-vehicles']);
  }
}

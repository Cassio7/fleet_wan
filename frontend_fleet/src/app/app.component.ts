import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from "./Dashboard/Components/footer/footer.component";
import { filter, Subject } from 'rxjs';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { NavbarComponent } from './Common components/navbar/navbar.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
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
export class AppComponent implements OnInit, OnDestroy{
  @ViewChild('drawer') sidebar!: MatDrawer;
  title = 'frontend_fleet';
  private readonly destroy$: Subject<void> = new Subject<void>();


  constructor(private router: Router){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

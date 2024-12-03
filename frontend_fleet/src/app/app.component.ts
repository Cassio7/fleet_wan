import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from "./Common-components/footer/footer.component";
import { filter, Subject, takeUntil } from 'rxjs';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { NavbarComponent } from './Common-components/navbar/navbar.component';
import { MatButtonModule } from '@angular/material/button';
import { LoginService } from './Common-services/login/login.service';
import { CommonModule } from '@angular/common';

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
  @ViewChild('drawer') sidebar!: MatDrawer;
  isLogged = false;
  title = 'frontend_fleet';
  private readonly destroy$: Subject<void> = new Subject<void>();


  constructor(
    private router: Router,
    private loginService: LoginService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.loginService.login$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.isLogged = true;
        this.cd.detectChanges();
      },
      error: error => console.error("Error logging in: ", error)
    });
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

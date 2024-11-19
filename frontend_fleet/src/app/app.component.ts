import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from "./Dashboard/Components/footer/footer.component";
import { filter, Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy{
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

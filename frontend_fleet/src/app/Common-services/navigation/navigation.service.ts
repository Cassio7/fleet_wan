import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private previousUrl: string | null = null;
  private currentUrl: string | null = null;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
      }
    });
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }
}

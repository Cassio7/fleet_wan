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

  getGoBackTextByUrl(previous_url: string): string{
    switch (previous_url) {
      case '/dashboard':
        return 'Torna alla dashboard';
      case '/home-mezzi':
        return 'Torna al parco mezzi';
      case '/storico-mezzi':
        return 'Torna allo storico mezzi';
      case '/home-mappa':
        return 'Torna alla mappa dei mezzi';
      case '/scarico-letture':
        return 'Torna allo scarico delle letture';
      case '/notifications':
        return "Torna alla visualizzazione delle notifiche";
      default:
        if (previous_url?.includes("dettaglio-mezzo")) {
          const match = previous_url.match(/dettaglio-mezzo\/(\d+)/);
          const veId = match ? match[1] : "";
          return `Torna al dettaglio del mezzo ${veId}`;
        }
    }
    return "";
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }
}

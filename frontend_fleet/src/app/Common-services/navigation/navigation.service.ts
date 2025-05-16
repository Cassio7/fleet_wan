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

  /**
   * Permette di ottenere il testo del link per tornare alla pagina precedente
   * @param previous_url url della pagina precedente
   * @returns stringa contenuto del testo di go back
   */
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
      case '/gestione-utenti':
        return 'Torna alla gestione degli utenti';
      case '/gestione-cantieri':
        return 'Torna alla gestione dei cantieri';
      case '/gestione-veicoli':
        return 'Torna alla gestione dei veicoli';
      case '/gestione-societa':
        return 'Torna alla gestione delle società';
      case '/notifications':
        return "Torna alla visualizzazione delle notifiche";
      case '/top-speeds':
        return "Torna alla classifica delle velocità"
      default:
        if(previous_url?.includes('/profile/')){
          const match = previous_url.match(/profile\/(\d+)/);
          const userId = match ? match[1] : "sconosciuto";
          return `Torna alla gestione dell'utente ${userId}`;
        }
        if(previous_url?.includes('/cantiere')){
          const match = previous_url.match(/cantiere\/(\d+)/);
          const worksiteId = match ? match[1] : "sconosciuto";
          return `Torna alla gestione del cantiere ${worksiteId}`;
        }
        if (previous_url?.includes("dettaglio-mezzo")) {
          const match = previous_url.match(/dettaglio-mezzo\/(\d+)/);
          const veId = match ? match[1] : "sconosciuto";
          return `Torna al dettaglio del mezzo ${veId}`;
        }
    }
    return "";
  }

  /**
   * Permette di ottenere il precedente url
   * @returns url precedente se questo non è uguale a '/profile' o '/notifications'
   * @returns null se invece è uguale a uno dei due
   */
  getPreviousUrl(): string | null {
    if (this.previousUrl != '/profile' && this.previousUrl != '/notifications'){
      return this.previousUrl;
    }else{
      return null;
    }
  }
}

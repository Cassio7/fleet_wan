import { Injectable } from '@angular/core';
import { Notifica } from '../../../../Models/Notifica';

@Injectable({
  providedIn: 'root',
})
export class NotificationsFilterService {
  constructor() {}

  /**
   * Filtra delle notifiche in base ad una ricerca sull'username dell'autore di quest'ultime
   * @param notifiche notifiche da filtrare
   * @param usernameResearch ricerca per username
   * @returns array di notifiche filtrato
   */
  filterNotificationsByUsername(
    notifiche: Notifica[],
    usernameResearch: string
  ): Notifica[] {
    if (usernameResearch) {
      return notifiche.filter((notifica) => {
        return notifica.author.includes(usernameResearch);
      });
    } else {
      return notifiche;
    }
  }
}

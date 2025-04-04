import { Injectable } from '@angular/core';
import { Notifica } from '../../../Models/Notifica';

@Injectable({
  providedIn: 'root'
})
export class NotificationsFilterService {

  constructor() { }

  filterNotificationsByUsername(notifiche: Notifica[], usernameResearch: string): Notifica[]{
    if(usernameResearch){
      return notifiche.filter(notifica => {
        return notifica.author.includes(usernameResearch);
      })
    }else{
      return notifiche;
    }
  }
}

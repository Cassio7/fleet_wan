import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket!: Socket;
  private notifySubject: Subject<any> = new Subject<any>();

  constructor() {}

  /**
   * Connette il socket dell'utente al websocket
   */
  connectToWebSocket(access_token: string) {
    this.socket = io('ws://10.1.0.102:3001/', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      query: {
        token: access_token,
      },
    });

    //ascolto della connessione
    this.socket.on('connect', () => {});

    //ascolto degli eventi delle notifiche
    this.socket.on('notify', (data: any) => {
      this.notifySubject.next(data);
    });

    //ascolto degli eventi delle notifiche
    this.socket.on('ban', (data: any) => {
      console.log(data);
    });
  }

  /**
   * Invia un messaggio al canale "notify"
   * @param message messaggio
   */
  sendMessageToNotifyChannel(message: string): void {
    this.socket.emit('notify', message);
  }

  /**
   * Permette di mettersi in ascolto dei messaggi inviati sul canale 'notify'
   * @returns Observable che emette i messaggi di notifica.
   */
  getNotifyMessages() {
    return this.notifySubject.asObservable();
  }

  /**
   * Disconnette il socket dal websocket
   */
  disconnect() {
    this.socket.disconnect();
  }
}

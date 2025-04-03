import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;
  private notifySubject: Subject<any> = new Subject<any>();

  constructor() {
    this.socket = io('ws://10.1.0.102:3001/events', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    this.socket.on('notify', (data: any) => {
      this.notifySubject.next(data);
    });
  }

  sendMessageToNotifyChannel(message: any): void {
    this.socket.emit('notify', message);
  }

  getNotifyMessages() {
    return this.notifySubject.asObservable();
  }

  disconnect() {
    this.socket.disconnect();
  }
}

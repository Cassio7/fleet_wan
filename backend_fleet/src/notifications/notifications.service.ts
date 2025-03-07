import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  // Metodo per inviare una notifica tramite WebSocket
  sendNotification(message: string) {
    this.notificationsGateway.handleSendNotificationServer(message);
  }
}

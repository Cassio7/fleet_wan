import { Injectable } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { NotificationDto } from 'classes/dtos/notification.dto';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'events', // Abilita le richieste da qualsiasi origine (puoi limitare ai tuoi domini)
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Metodo chiamato quando un client si connette
  handleConnection(client: Socket): void {
    console.log(`🔗 Client connesso: ${client.id}`);
  }

  // Metodo chiamato quando un client si disconnette
  handleDisconnect(client: Socket): void {
    console.log(`❌ Client disconnesso: ${client.id}`);
  }

  handleSendNotificationServer(
    @MessageBody() notification: NotificationDto,
  ): void {
    try {
      this.server.emit('notify', notification);
    } catch (error) {
      console.log(error);
    }
  }
}

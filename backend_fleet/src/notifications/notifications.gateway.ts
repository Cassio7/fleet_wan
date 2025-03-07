import { Injectable } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
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
  handleConnection(client: Socket) {
    console.log(`🔗 Client connesso: ${client.id}`);
  }

  // Metodo chiamato quando un client si disconnette
  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnesso: ${client.id}`);
  }

  handleSendNotificationServer(@MessageBody() data: string) {
    this.server.emit('notify', data); // Invia la notifica a tutti i client connessi
  }
}

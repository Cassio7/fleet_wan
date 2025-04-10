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
import { AuthService } from 'src/services/auth/auth.service';

@WebSocketGateway()
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly authService: AuthService) {}
  //private clients: Map<string, ClientData> = new Map();

  @WebSocketServer()
  server: Server;

  // Metodo chiamato quando un client si connette
  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.query.token as string;
    if (!token) {
      client.disconnect();
      console.log('client disconnesso');
      return;
    }
    const user = await this.authService.validateToken(token);
    console.log(`🔗 Client connesso: ${client.id} utente: ${user.username}`);
    await this.authService.setClientIdRedis(user.key, client.id);
  }

  // Metodo chiamato quando un client si disconnette
  async handleDisconnect(client: Socket): Promise<void> {
    const token = client.handshake.query.token as string;
    if (!token) {
      client.disconnect();
      console.log('client disconnesso');
      return;
    }
    const user = await this.authService.validateToken(token);
    console.log(`❌ Client disconnesso: ${client.id}`);
    await this.authService.deleteClientRedis(user.key);
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

  async sendMessageToUser(userKey: string, message: string): Promise<void> {
    const clientId = await this.authService.getClientRedis(userKey);
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.emit('ban', message);
    } else {
      console.log(`Client con user.key ${userKey} non trovato`);
    }
  }
}

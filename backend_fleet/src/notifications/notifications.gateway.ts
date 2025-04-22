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
  @WebSocketServer()
  server: Server;

  // Metodo chiamato quando un client si connette
  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.query.token as string;
    if (!token) {
      client.disconnect();
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
      return;
    }
    const user = await this.authService.validateToken(token);
    console.log(`❌ Client disconnesso: ${client.id}`);
    await this.authService.deleteClientRedis(user.key);
  }

  /**
   * invia una notifica a tutti quelli che sono connessi al canale
   * @param notification
   */
  handleSendNotificationServer(
    @MessageBody() notification: NotificationDto,
  ): void {
    try {
      this.server.emit('notify', notification);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * invia una notifica mirata ad uno specifico client
   * @param userKey
   * @param message
   */
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

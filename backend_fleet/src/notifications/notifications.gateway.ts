import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { NotificationDto } from 'classes/dtos/notification.dto';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/services/auth/auth.service';

@WebSocketGateway()
@Injectable()
export class NotificationsGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly subscriberRedis: Redis;

  constructor(
    private readonly authService: AuthService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    const redisOptions = {
      host: process.env.REDIS_HOST,
      port: 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB),
    };
    this.subscriberRedis = new Redis(redisOptions);
  }

  /**
   * alla creazione fa una subscribe al canale per invio dei messaggi
   */
  async onModuleInit() {
    await this.subscriberRedis.subscribe('user_ban:request');
    this.subscriberRedis.on('message', async (channel, message) => {
      if (channel === 'user_ban:request') {
        const { userKey } = JSON.parse(message);
        const clientId = await this.authService.getClientRedis(userKey);
        const client = this.server.sockets.sockets.get(clientId);
        // controllo se questa instance ha il client connesso
        if (client) {
          client.emit('ban', 'suspended');
        }
      }
    });
  }

  /**
   * disconnetto il redis quando viene chiuso
   */
  async onModuleDestroy() {
    await this.subscriberRedis.unsubscribe('user_ban:request');
    this.subscriberRedis.disconnect();
  }

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
      // nel caso di fail mando una pub per mandare richiesta al ws connesso
      this.redis.publish(
        'user_ban:request',
        JSON.stringify({ userKey: userKey }),
      );
      console.log(`Client con user.key ${userKey} non trovato`);
    }
  }
}

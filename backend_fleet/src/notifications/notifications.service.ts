import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { NotificationEntity } from 'classes/entities/notification.entity';
import { DataSource } from 'typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { UserEntity } from 'classes/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // Metodo per inviare una notifica tramite WebSocket
  sendNotification(message: string) {
    this.notificationsGateway.handleSendNotificationServer(message);
  }

  /**
   * Creazione di una notifica ed associo all utente
   * @param userId user id 
   * @param message messaggio
   */
  async createNotification(userId: number, message: string) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const user = await queryRunner.manager.getRepository(UserEntity).findOne({
        where: {
          id: userId,
        },
      });
      if (!user) {
      }
      const notification = queryRunner.manager
        .getRepository(NotificationEntity)
        .create({
          isRead: false,
          message: message,
          user: user,
        });
      await queryRunner.manager
        .getRepository(NotificationEntity)
        .save(notification);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante la creazione dell'utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

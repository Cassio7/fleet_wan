import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from 'classes/entities/notification.entity';
import { DataSource, Repository } from 'typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { UserEntity } from 'classes/entities/user.entity';
import { NotificationDto } from 'classes/dtos/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly notificationsGateway: NotificationsGateway,
    @InjectRepository(NotificationEntity, 'readOnlyConnection')
    private readonly notificationRepository: Repository<NotificationEntity>,
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
  async createNotification(userId: number, title: string, message: string) {
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
        await queryRunner.rollbackTransaction();
        return;
      }
      const notification = queryRunner.manager
        .getRepository(NotificationEntity)
        .create({
          isRead: false,
          title: title,
          message: message,
          user: user,
        });
      await queryRunner.manager
        .getRepository(NotificationEntity)
        .save(notification);
      await queryRunner.commitTransaction();
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

  /**
   * Aggiorna lo stato della notifica da letta a non letta e vicersa
   * @param notificationKey key univoca notifica
   * @returns
   */
  async updateNotificationRead(
    notificationKey: string,
  ): Promise<NotificationDto | null> {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      if (!String(notificationKey)) {
        await queryRunner.rollbackTransaction();
        return null;
      }
      const notification = await this.notificationRepository.findOne({
        where: {
          key: notificationKey,
        },
      });
      if (!notification) {
        await queryRunner.rollbackTransaction();
        return null;
      }
      const newIsReadStatus = !notification.isRead;

      await queryRunner.manager.getRepository(NotificationEntity).update(
        {
          key: notification.key,
        },
        { isRead: newIsReadStatus },
      );
      await queryRunner.commitTransaction();
      notification.isRead = newIsReadStatus;
      return this.toDTO(notification);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante update lettura notifica`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ritorna tutte le notifiche in base all utente che le richiede
   * @param userId
   * @returns
   */
  async getNotifications(
    userId: number,
    read?: string,
  ): Promise<NotificationDto[] | null> {
    try {
      if (!Number(userId)) {
        return null;
      }
      if (read === undefined) {
        const notifications = await this.notificationRepository.find({
          where: {
            user: {
              id: userId,
            },
          },
        });
        return notifications
          ? notifications.map((notification) => this.toDTO(notification))
          : null;
      }
      const isRead = read === 'true';
      const notifications = await this.notificationRepository.find({
        where: {
          user: {
            id: userId,
          },
          isRead: isRead,
        },
      });
      return notifications
        ? notifications.map((notification) => this.toDTO(notification))
        : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante la creazione dell'utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private toDTO(notification: NotificationEntity): NotificationDto {
    const notDTO = new NotificationDto();
    notDTO.key = notification.key;
    notDTO.title = notification.title;
    notDTO.message = notification.message;
    notDTO.isRead = notification.isRead;
    return notDTO;
  }
}

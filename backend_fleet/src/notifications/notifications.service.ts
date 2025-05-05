import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { NotificationDto } from 'src/classes/dtos/notification.dto';
import { NotificationEntity } from 'src/classes/entities/notification.entity';
import { UserEntity } from 'src/classes/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { NotificationsGateway } from './notifications.gateway';

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
  sendNotification(notification: NotificationDto): void {
    this.notificationsGateway.handleSendNotificationServer(notification);
  }

  sendNotificationToUser(userKey: string, message: string) {
    this.notificationsGateway.sendMessageToUser(userKey, message);
  }

  /**
   * Creazione di una notifica ed associo all utente
   * @param userId user id di chi può visua
   * @param author autore
   * @param title titolo
   * @param message contenuto
   * @returns NotificationDTO della notifica creata
   */
  async createNotification(
    userId: number,
    author: string,
    title: string,
    message: string,
  ): Promise<NotificationDto> {
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
          author: author,
          title: title,
          message: message,
          user: user,
        });
      await queryRunner.manager
        .getRepository(NotificationEntity)
        .save(notification);
      await queryRunner.commitTransaction();
      return this.toDTO(notification);
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
   * @returns messaggio
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
   * Imposta lo stato di lettura di tutte le notifiche in base al parametro passato
   * @param read boolean value
   */
  async setAllNotificationsTo(
    read: boolean,
  ): Promise<NotificationDto[] | null> {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const notificationsNumber = await this.notificationRepository.count();
      if (!notificationsNumber) {
        await queryRunner.rollbackTransaction();
        return null;
      }
      await queryRunner.manager
        .getRepository(NotificationEntity)
        .update({}, { isRead: read });
      await queryRunner.commitTransaction();
      const notifications = await this.notificationRepository.find();
      return notifications
        ? notifications.map((notification) => this.toDTO(notification))
        : null;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante update lettura per tutte le notifiche`,
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
          order: {
            createdAt: 'DESC',
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
        order: {
          createdAt: 'DESC',
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

  /**
   * Elimina una nota
   * @param notificationKey key della notifica da eliminare
   * @returns
   */
  async deleteNotification(notificationKey: string): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!String(notificationKey)) {
        await queryRunner.rollbackTransaction();
        return false;
      }

      const notification = await queryRunner.manager
        .getRepository(NotificationEntity)
        .findOne({
          where: {
            key: notificationKey,
          },
        });

      if (!notification) {
        await queryRunner.rollbackTransaction();
        return false;
      }

      await queryRunner.manager.getRepository(NotificationEntity).softDelete({
        key: notificationKey,
      });

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante l'eliminazione della notifica`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private toDTO(notification: NotificationEntity): NotificationDto {
    const notDTO = new NotificationDto();
    notDTO.key = notification.key;
    notDTO.createdAt = notification.createdAt;
    notDTO.title = notification.title;
    notDTO.message = notification.message;
    notDTO.isRead = notification.isRead;
    notDTO.author = notification.author;
    return notDTO;
  }
}

import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/classes/enum/role.enum';
import { UserFromToken } from 'src/classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { isUUID } from 'src/utils/utils';
import { NotificationsService } from './notifications.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per recuperare le notifiche in base all'utente
   * @param req user data
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Get()
  async getNotifications(
    @Req() req: Request & { user: UserFromToken },
    @Query('read') read: string,
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notification All Admin',
    };
    try {
      const notifications = await this.notificationsService.getNotifications(
        req.user.id,
        read,
      );
      if (!notifications?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna notifica trovata',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate ${notifications.length} notifiche`,
      );
      return res.status(200).json(notifications);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero notifiche',
      });
    }
  }

  /**
   * API per eliminare una notifica
   * @param req user data
   * @param key key della notifica da eliminare
   * @param res
   * @returns messaggio
   */
  @Roles(Role.Admin)
  @Delete(':key')
  async deleteNotification(
    @Req() req: Request & { user: UserFromToken },
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notification Admin',
      resourceKey: key,
    };

    try {
      const result = await this.notificationsService.deleteNotification(key);

      if (!result) {
        this.loggerService.logCrudSuccess(
          context,
          'delete',
          `Notifica con key ${key} non trovata.`,
        );
        return res.status(404).json({
          message: `Notifica con key ${key} non trovata.`,
        });
      }

      this.loggerService.logCrudSuccess(
        context,
        'delete',
        `Notifica con key ${key} eliminata con successo.`,
      );

      return res.status(200).json({
        message: `Notifica con key ${key} eliminata con successo.`,
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'delete',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore durante eliminazione della notifica',
      });
    }
  }

  /**
   * API per aggiornare lo stato di lettura di una notifica
   * @param req user data
   * @param key chiave univoca
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Patch(':key')
  async updateNotificationRead(
    @Req() req: Request & { user: UserFromToken },
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notification Admin',
      resourceKey: key,
    };
    const notificationkey = key;
    if (isUUID(notificationkey)) {
      this.loggerService.logCrudError({
        error: new Error('Key deve essere una stringa valida'),
        context,
        operation: 'update',
      });
      return res.status(400).json({
        message: 'Key deve essere una stringa valida',
      });
    }
    try {
      const notification =
        await this.notificationsService.updateNotificationRead(notificationkey);
      if (!notification) {
        this.loggerService.logCrudSuccess(
          context,
          'update',
          `Notifica con key: ${notificationkey} non trovata`,
        );
        return res.status(404).json({
          message: `Notifica con key: ${notificationkey} non trovata`,
        });
      }
      this.loggerService.logCrudSuccess(
        context,
        'update',
        `Aggiornata la vista della notifica key: ${notificationkey}`,
      );
      return res.status(200).json({
        notification: notification,
        message: 'Notifica aggiornata con successo!',
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'update',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore update notifiche',
      });
    }
  }
}

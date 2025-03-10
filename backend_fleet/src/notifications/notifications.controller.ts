import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { LoggerService } from 'src/log/service/logger.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { LogContext } from 'src/log/logger.types';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per recuperare le notifiche
   * @param req user data
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Get()
  async getNotifications(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notification All',
    };
    try {
      const notification = await this.notificationsService.getNotifications(
        req.user.id,
      );
      if (!notification?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna notifica trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate ${notification.length} Notifiche`,
      );
      return res.status(200).json(notification);
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
   * API per aggiornare e segnare una notifica come letta
   * @param req user data
   * @param body id della notifica da aggiornare
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Put()
  async updateNotificationRead(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { notificationId: number },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notification update read',
      resourceId: body.notificationId,
    };
    const notificationId = Number(body.notificationId);
    if (isNaN(notificationId)) {
      this.loggerService.logCrudError({
        error: new Error('Id deve essere un numero valido'),
        context,
        operation: 'update',
      });
      return res.status(400).json({
        message: 'Id deve essere un numero valido',
      });
    }
    try {
      const data =
        await this.notificationsService.updateNotificationRead(notificationId);
      if (!data) {
        this.loggerService.logCrudSuccess(
          context,
          'update',
          `Notifica con id: ${notificationId} non trovata`,
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Aggiornata la vista della notifica id: ${notificationId}`,
      );
      return res.status(200).json({
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

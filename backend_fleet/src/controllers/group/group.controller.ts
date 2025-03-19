import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { GroupService } from 'src/services/group/group.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('groups')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per tornare tutti i gruppi presenti nel db
   * @param req user data
   * @param res
   * @returns
   */
  @Get()
  async getAllGroups(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Groups All admin',
    };
    try {
      const groups = await this.groupService.getAllGroups();
      if (!groups?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun comune trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${groups.length} comune`,
      );
      return res.status(200).json(groups);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero comuni',
      });
    }
  }

  /**
   * API per tornare il gruppo in base all id passato
   * @param res
   * @param params id identificativo del gruppo
   */
  @Get(':id')
  async getGroupById(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id') groupId: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Groups All admin',
      resourceId: groupId,
    };
    try {
      const group = await this.groupService.getGroupById(Number(groupId));
      if (!group) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Nessun comune trovato',
        );
        return res.status(204).json({
          message: 'Nessun comune trovato',
        });
      }

      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Recuperato comune ${group.name} con id: ${group.id}`,
      );
      return res.status(200).json(group);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero comune',
      });
    }
  }
}

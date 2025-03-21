import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LoggerService } from 'src/log/service/logger.service';
import { WorksiteService } from 'src/services/worksite/worksite.service';
import { Response } from 'express';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { LogContext } from 'src/log/logger.types';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('worksites')
export class WorksiteController {
  constructor(
    private readonly worksiteService: WorksiteService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per creare un nuovo cantiere
   * @param req
   * @param body
   * @param res
   * @returns
   */
  @Post()
  async createWorksite(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { name: string; groupId: number },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite',
    };

    try {
      if (!body.name) {
        return res
          .status(400)
          .json({ message: 'Inserisci un nome per il cantiere' });
      }
      const worksite = await this.worksiteService.createWorksite(
        body.name,
        Number(body.groupId),
      );
      this.loggerService.logCrudSuccess(
        context,
        'create',
        `Cantiere con nome ${worksite.name} salvato!`,
      );

      return res
        .status(200)
        .json({ message: `Cantiere con nome ${worksite.name} salvato!` });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'create',
      });
      return res.status(error.status || 500).json({
        message:
          error.message || 'Errore nella registrazione del nuovo cantiere',
      });
    }
  }

  /**
   * API per recuperare tutti i cantieri
   * @param req
   * @param res
   * @returns
   */
  @Get()
  async getWorksites(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite All admin',
    };
    try {
      const worksites = await this.worksiteService.getWorksiteAdmin();
      if (!worksites?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun cantiere trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${worksites.length} cantieri`,
      );
      return res.status(200).json(worksites);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero cantieri',
      });
    }
  }

  /**
   * API per recuperare soltanto 1 cantiere tramite id
   * @param req user data
   * @param res
   * @param id id del cantiere
   * @returns
   */
  @Get(':id')
  @UsePipes(ParseIntPipe)
  async getWorksiteById(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id') worksiteId: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite',
      resourceId: worksiteId,
    };
    try {
      const worksite = await this.worksiteService.getWorksiteById(worksiteId);
      if (!worksite) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Nessun cantiere trovato',
        );
        return res.status(204).json({
          message: 'Nessun cantiere trovato',
        });
      }

      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Recuperato cantiere ${worksite.name} con id: ${worksite.id}`,
      );
      return res.status(200).json(worksite);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero cantiere',
      });
    }
  }

  /**
   * API per eliminare un cantiere
   * @param req
   * @param res
   * @param worksiteId id del cantiere
   * @returns
   */
  @Delete(':id')
  @UsePipes(ParseIntPipe)
  async deleteWorksite(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id') worksiteId: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite',
      resourceId: worksiteId,
    };
    try {
      await this.worksiteService.deleteWorksite(Number(worksiteId));
      this.loggerService.logCrudSuccess(
        context,
        'delete',
        `Cantiere con id ${worksiteId} eliminato`,
      );

      return res.status(200).json({
        message: `Cantiere con id ${worksiteId} eliminato!`,
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'delete',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore eliminazione cantiere',
      });
    }
  }
}

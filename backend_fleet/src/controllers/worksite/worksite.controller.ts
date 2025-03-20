import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { WorksiteService } from 'src/services/worksite/worksite.service';

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

      return res.status(201).json({
        message: `Cantiere con nome ${worksite.name} salvato!`,
        worksite: worksite,
      });
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
   * API per il recupero dei cantieri associati in base al utente loggato
   * @param req used data
   * @param res
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Get('me')
  async getWorksiteMe(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite',
    };
    try {
      const worksites = await this.worksiteService.getWorksitesByUser(
        req.user.id,
      );
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Numero di cantieri recuperati ${worksites.length}`,
      );
      return res.status(200).json(worksites);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore durante il recupero dei cantieri',
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
  async getWorksiteById(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id', ParseIntPipe) worksiteId: number,
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
   * Metodo per aggiornare i dati di un cantiere
   * @param worksiteId ID del cantiere
   * @param name Nuovo nome del cantiere
   */
  @Put(':id')
  async updateWorksite(
    @Req() req: Request & { user: UserFromToken },
    @Param('id', ParseIntPipe) worksiteId: number,
    @Body() body: { name?: string; groupId?: number },
    @Res() res: Response,
  ) {
    const { groupId, name } = body;

    const context = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite',
      resourceId: worksiteId,
    };

    try {
      const updatedWorksite = await this.worksiteService.updateWorksite(
        worksiteId,
        name,
        Number(groupId),
      );

      this.loggerService.logCrudSuccess(
        context,
        'update',
        `Cantiere con id: ${updatedWorksite.id} aggiornato con successo`,
      );

      return res.status(200).json(updatedWorksite);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'update',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore aggiornamento cantiere',
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
  async deleteWorksite(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id', ParseIntPipe) worksiteId: number,
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

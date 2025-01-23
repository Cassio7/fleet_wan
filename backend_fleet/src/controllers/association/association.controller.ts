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
import { UserDTO } from 'classes/dtos/user.dto';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { AssociationService } from 'src/services/association/association.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('associations')
export class AssociationController {
  constructor(
    private readonly associationService: AssociationService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Recupera tutti le associazioni di ogni utente registrato
   * @param req user data
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Get()
  async getAllAssociation(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Association (admin)',
    };
    try {
      const association = await this.associationService.getAllAssociation();
      if (!association?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna associazione trovata',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Trovate ${association.length} associazioni`,
      );

      return res.status(200).json(association);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero delle associazioni',
      });
    }
  }

  /**
   * API per inserire una nuova associazione tra un cantiere/società ed un utente,
   * rispettando il ruolo associato e la visualizzazione corretta
   * @param res
   * @param userDTO id utente
   * @param body worksiteId oppure companyId
   * @returns
   */
  @Roles(Role.Admin)
  @Post()
  async createAssociation(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() userDTO: UserDTO,
    @Body() body: { worksiteIds: number[]; companyIds: number[] },
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Association (admin)',
      resourceId: userDTO.id,
    };
    try {
      const association = await this.associationService.createAssociation(
        userDTO,
        body.worksiteIds,
        body.companyIds,
      );
      this.loggerService.logCrudSuccess(
        context,
        'create',
        `Associazioni create per utente: ${association[0].user.username}`,
      );
      return res
        .status(200)
        .json({ message: 'Associazione inserita con successo!' });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'create',
      });
      return res.status(error.status || 500).json({
        message:
          error.message ||
          'Errore nella registrazione della nuova associazione',
      });
    }
  }

  /**
   * API per eliminare una associazione in base all id inserito
   * @param req user data
   * @param res
   * @param id identificativo del associazione
   * @returns
   */
  @Roles(Role.Admin)
  @Delete(':id')
  @UsePipes(ParseIntPipe)
  async deleteAssociation(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Association (admin)',
      resourceId: id,
    };
    try {
      await this.associationService.deleteAssociation(id);

      this.loggerService.logCrudSuccess(
        context,
        'delete',
        `Associazione con id ${id} eliminata`,
      );

      return res
        .status(200)
        .json({ message: 'Associazione eliminata con successo!' });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'delete',
      });

      return res.status(error.status || 500).json({
        message:
          error.message || 'Errore nella eliminazione della associazione',
      });
    }
  }
}

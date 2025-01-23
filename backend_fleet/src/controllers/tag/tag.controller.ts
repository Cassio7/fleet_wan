import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { TagService } from 'src/services/tag/tag.service';
import { validateDateRange } from 'src/utils/utils';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
@Controller('tags')
export class TagController {
  constructor(
    private readonly tagService: TagService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per recuperare tutti i tag history e i dati relativi in base al veicolo passato
   * @param req user data
   * @param body veId identificativo veicolo
   * @param res
   * @returns
   */
  @Post()
  async getAllTagHistoryByVeId(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { veId: number },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Tag All',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero

    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    try {
      const tags = await this.tagService.getAllTagHistoryByVeId(
        req.user.id,
        veId,
      );
      if (!tags?.length) {
        this.loggerService.logCrudSuccess(context, 'list', `Tag non trovati`);
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Numero di tag recuperati ${tags.length}`,
      );
      return res.status(200).json(tags);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || `Errore durante il recupero dei tag`,
      });
    }
  }

  /**
   * API per il recupero dell'ultimo Tag letto in base al veicolo passato
   * @param req user data
   * @param body veid del veicolo
   * @param res
   * @returns
   */
  @Post('last')
  async getLastTagHistoryByVeId(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { veId: number },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Tag ultimo',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero

    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'read',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    try {
      const tag = await this.tagService.getLastTagHistoryByVeId(
        req.user.id,
        veId,
      );
      if (!tag) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          `Nessuna tag trovato`,
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Recuperato il tag con id: ${tag.id}`,
      );
      return res.status(200).json(tag);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore durante il recupero del Tag',
      });
    }
  }

  /**
   * API per prendere tutti i tag history indicando range temporale in base all'id
   * @param res
   * @param params VeId
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post('ranged')
  async getTagHistoryByVeIdRanged(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { veId: number; dateFrom: string; dateTo: string },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Tag ranged',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero

    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;

    // controllo data valida
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      this.loggerService.logCrudError({
        error: new Error(validation.message),
        context,
        operation: 'list',
      });
      return res.status(400).json({ message: validation.message });
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);
    try {
      const data = await this.tagService.getTagHistoryByVeIdRanged(
        req.user.id,
        veId,
        dateFrom_new,
        dateTo_new,
      );
      if (!data?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun tag trovato',
        );
        return res.status(204).json({ message: 'Nessun tag trovato' });
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Lista tag (${data.length}) recuperata con successo, VeId = ${veId}, dateFrom = ${dateFrom_new.toISOString()}, dateFrom = ${dateTo_new.toISOString()}`,
      );
      return res.status(200).json(data);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message:
          error.message || 'Errore nel recupero dei tag con range temporale',
      });
    }
  }

  /**
   * API per recuperare l'andamento del detection quality per ogni lettura, diviso di ora in ora
   * per ammortizzare il carico di dati. In base al veicolo passato
   * @param req user data
   * @param body veid identificativo veicolo
   * @param res
   * @returns
   */
  @Post('detection')
  async getDetectionQualityBiVeId(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { veId: number },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Tag Detection',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero

    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    try {
      const detections = await this.tagService.getDetectionQualityBiVeId(
        req.user.id,
        veId,
      );
      if (!detections?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna dato trovato',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${detections.length} dati`,
      );
      return res.status(200).json(detections);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero delle letture dei tag',
      });
    }
  }
}

import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { TagDTO } from 'src/classes/dtos/tag.dto';
import { Role } from 'src/classes/enum/role.enum';
import { UserFromToken } from 'src/classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { TagService } from 'src/services/tag/tag.service';
import { sameDate, validateDateRange } from 'src/utils/utils';
import { ExportService } from './../../services/tag/export/export.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
@Controller('tags')
export class TagController {
  constructor(
    private readonly tagService: TagService,
    private readonly loggerService: LoggerService,
    private readonly exportService: ExportService,
  ) {}

  /**
   * API per recuperare tutti i tag history e i dati relativi in base al veicolo passato
   * @param req user data
   * @param veId identificativo del veicolo
   * @param dateFrom facoltativo, indica data e ora di inizio ricerca
   * @param dateTo facoltativo, indica data e ora fine ricerca
   * @param last indica se api deve recuperare solo l'ultima lettura
   * @param less diminuisce al 25% il numero di tag recuperati
   * @param res
   * @returns
   */
  @Get()
  async getTagByVeId(
    @Req() req: Request & { user: UserFromToken },
    @Query('veId') veId: number,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('last') last: string,
    @Query('less') less: string,
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Tag',
      resourceId: veId,
    };

    // Validate veId is a number
    const veIdNumber = Number(veId);
    if (isNaN(veIdNumber)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    const isLast = last === 'true';
    const isLess = less === 'true';
    try {
      let tags: TagDTO[] = [];

      if (dateFrom && dateTo && !isLast) {
        // Validate date range
        const validation = validateDateRange(dateFrom, dateTo);
        if (!validation.isValid) {
          this.loggerService.logCrudError({
            error: new Error(validation.message),
            context,
            operation: 'list',
          });
          return res.status(400).json({ message: validation.message });
        }

        // Parse dates and get filtered tags
        const parsedDateFrom = dateFrom.endsWith('Z')
          ? new Date(dateFrom)
          : new Date(dateFrom + 'Z');
        const parsedDateTo = dateTo.endsWith('Z')
          ? new Date(dateTo)
          : new Date(dateTo + 'Z');
        const equal = sameDate(parsedDateFrom, parsedDateTo);
        if (equal) {
          parsedDateTo.setHours(23, 59, 59, 0);
        }
        tags = await this.tagService.getTagHistoryByVeIdRanged(
          req.user.id,
          veIdNumber,
          parsedDateFrom,
          parsedDateTo,
          isLess,
        );
      } else if (isLast) {
        // recupero l'ultimo
        tags = await this.tagService.getLastTagHistoryByVeId(
          req.user.id,
          veIdNumber,
        );
      } else {
        // Get all tags if no date range specified
        tags = await this.tagService.getAllTagHistoryByVeId(
          req.user.id,
          veIdNumber,
        );
      }

      // Handle response based on results
      if (!tags?.length) {
        this.loggerService.logCrudSuccess(context, 'list', 'Tag non trovati');
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
        message: error.message || 'Errore durante il recupero dei tag',
      });
    }
  }

  /**
   * API per lo scarico delle letture, si deve inserire il range di date e se si vuole
   * id del cantire
   * @param req user token dana
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @param worksite id del cantiere
   * @param count boolean che indica se ritorno soltanto il numero di tag
   * @param preview boolean che ritorna il numero di tag e i primi 100 tag limitati
   * @param res
   * @returns
   */
  @Get('download')
  async getAllTagsRanged(
    @Req() req: Request & { user: UserFromToken },
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('worksite') worksite: number | number[],
    @Query('count') count: string,
    @Query('preview') preview: string,
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Tag',
    };
    try {
      const validation = validateDateRange(dateFrom, dateTo);
      if (!validation.isValid) {
        this.loggerService.logCrudError({
          error: new Error(validation.message),
          context,
          operation: 'list',
        });
        return res.status(400).json({ message: validation.message });
      }

      // Parse dates and get filtered tags
      const parsedDateFrom = new Date(dateFrom + 'Z');
      const parsedDateTo = new Date(dateTo + 'Z');
      parsedDateFrom.setHours(0, 0, 0, 0);
      parsedDateTo.setHours(23, 59, 59, 999);
      const equal = sameDate(parsedDateFrom, parsedDateTo);
      if (equal) {
        parsedDateTo.setHours(23, 59, 59, 0);
      }
      const isCount = count === 'true';
      const isPreview = preview === 'true';

      const worksites = Array.isArray(worksite)
        ? worksite
        : worksite
          ? [worksite]
          : [];

      if (isCount) {
        const count = await this.tagService.getNCountTagsRange(
          req.user.id,
          parsedDateFrom,
          parsedDateTo,
          worksites,
        );
        if (!count) {
          this.loggerService.logCrudSuccess(context, 'list', 'Tag non trovati');
          return res.status(204).json();
        }
        this.loggerService.logCrudSuccess(
          context,
          'list',
          `Conteggio tag numero: ${count}`,
        );
        return res.status(200).json({ count: count });
      }
      if (isPreview) {
        const [count, tags] = await Promise.all([
          this.tagService.getNCountTagsRange(
            req.user.id,
            parsedDateFrom,
            parsedDateTo,
            worksites,
          ),
          this.tagService.getTagsByRangeWorksite(
            req.user.id,
            parsedDateFrom,
            parsedDateTo,
            worksites,
            isPreview,
          ),
        ]);
        this.loggerService.logCrudSuccess(
          context,
          'list',
          `Preview tag numero: ${count}`,
        );
        return res.status(200).json({ count: count, tags: tags });
      }
      const tagsCount = await this.tagService.getNCountTagsRange(
        req.user.id,
        parsedDateFrom,
        parsedDateTo,
        worksites,
      );
      await this.exportService.checkRedisExport(
        tagsCount,
        parsedDateFrom,
        parsedDateTo,
        res,
      );
      if (res.headersSent) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          `Numero di tag scaricati ${tagsCount}`,
        );
        return;
      }
      console.time('query');
      const tags = await this.tagService.getTagsByRangeWorksite(
        req.user.id,
        parsedDateFrom,
        parsedDateTo,
        worksites,
        isPreview,
      );
      console.timeEnd('query');
      if (!tags?.length) {
        this.loggerService.logCrudSuccess(context, 'list', 'Tag non trovati');
        return res.status(204).json();
      }
      console.time('export');
      await this.exportService.exportExcel(
        tags,
        parsedDateFrom,
        parsedDateTo,
        res,
      );
      console.timeEnd('export');
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Numero di tag scaricati ${tags.length}`,
      );
      return res.end();
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore durante il recupero dei tag',
      });
    }
  }

  /**
   * API per recuperare l'andamento del detection quality per ogni lettura, diviso per giornate.
   * Permette di specificare se recuperare i dati per mese o per numero di giorni, 0 - 0 indica tutti
   * @param req user data
   * @param body veid identificativo veicolo, months: numero mesi da recuperare, days: numero giorni da recuperare
   * @param res
   * @returns
   */
  @Post('detection')
  async getDetectionQualityBiVeId(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { veId: number; months: number; days: number },
    @Res() res: Response,
  ): Promise<Response> {
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
    const months = Number(body.months);
    const days = Number(body.days) || 0;

    if (isNaN(months) || isNaN(days)) {
      this.loggerService.logCrudError({
        error: new Error('Il mese o il giorno deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il mese oppure il giorno deve essere un numero valido',
      });
    }

    try {
      const detections = await this.tagService.getDetectionQualityByVeId(
        req.user.id,
        veId,
        months,
        days,
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

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { CompanyService } from 'src/services/company/company.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('companies')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Recupera tutte le società salvate
   * @param res
   */
  @Get()
  async getAllCompany(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Company All admin',
    };
    try {
      const company = await this.companyService.getAllCompany();
      if (!company?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna società trovata',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate ${company.length} società`,
      );
      return res.status(200).json(company);
    } catch (error) {
      console.error('Errore nel recupero delle società: ', error);
      res.status(500).json({ message: 'Errore nel recupero delle società.' });
    }
  }

  @Get(':id')
  @UsePipes(ParseIntPipe)
  async getCompanyById(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id') companyId: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Company',
      resourceId: companyId,
    };
    try {
      const company = await this.companyService.getCompanyById(
        Number(companyId),
      );
      if (!company) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Nessun società trovato',
        );
        return res.status(204).json({
          message: 'Nessun società trovato',
        });
      }

      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Recuperata società ${company.name} con id: ${company.id}`,
      );
      return res.status(200).json(company);
    } catch (error) {
      console.error('Errore nel recupero della società: ', error);
      res.status(500).json({ message: 'Errore nel recupero della società.' });
    }
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Request, Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { AuthService } from 'src/services/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loggerService: LoggerService,
  ) {}
  /**
   * Login utente
   * @param res ritorna il risultato dell'operazione
   * @param body username e password
   */
  @Post('login')
  async logIn(
    @Req() req: Request,
    @Body() body: Record<string, any>,
    @Res() res: any,
  ): Promise<Response> {
    this.loggerService.logClientData(req);
    const context: LogContext = {
      userId: 0,
      username: body.username,
      resource: 'Auth login',
    };
    try {
      const { access_token } = await this.authService.logIn(
        body.username,
        body.password,
      );
      res.cookie('authorization', access_token, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60 * 1000, // 24h
      });
      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Autenticazione di ${body.username} riuscita`,
      );
      return res.status(200).json({
        success: true,
        message: 'Autenticazione riuscita',
        access_token,
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore login utente',
      });
    }
  }

  /**
   * Pulisce il cookie per la sessione
   * @param res Ritorna il successo dell'operazione
   */
  @Get('logout')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Capo, Role.Responsabile)
  async logOut(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: any,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Auth logout',
    };
    try {
      const token = req.headers['authorization']; // accedi al cookie
      if (!token) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          `Logout di ${req.user.username} riuscito`,
        );
        return res.status(200).json({ message: 'Sei già uscito' });
      }
      res.clearCookie('authorization', {
        httpOnly: true,
        sameSite: 'Strict',
      });
      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Logout di ${req.user.username} riuscito`,
      );
      return res.status(200).json({ message: 'Logout riuscito' });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore logout utente',
      });
    }
  }

  /**
   * API per recuperare tutti i token impostati su bannati
   * @param req user data
   * @param res
   * @returns
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('ban')
  async getBannedToken(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Ban Token',
    };
    try {
      const tokens = await this.authService.getAllBannedTokens();
      if (!tokens?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun token bannato',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Trovati ${tokens.length} token bannati`,
      );

      res.status(200).json(tokens);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero dei token bannati',
      });
    }
  }

  /**
   * API per impostare su redis un token utente come bannato
   * @param req user data
   * @param body token utente
   * @param res
   * @returns
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('ban')
  async setBannedToken(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { token: string },
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Ban Token',
    };
    const token = body.token;
    try {
      if (!String(token)) {
        this.loggerService.logCrudError({
          error: new Error('Il token deve essere una stringa'),
          context,
          operation: 'update',
        });
        return res.status(400).json({
          message: 'Il token deve essere una stringa',
        });
      }
      await this.authService.setBannedToken(token);

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Token inserito nei bannati: ${token}`,
      );

      return res.status(200).json({ message: 'Token bannato' });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'update',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel ban del token',
      });
    }
  }

  /**
   * API per eliminare un token fornito da quelli bannati
   * @param req user data
   * @param body token da sbannare
   * @param res
   * @returns
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete('ban')
  async deleteBannedToken(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { token: string },
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Ban Token',
    };
    const token = body.token;
    try {
      if (!String(token)) {
        this.loggerService.logCrudError({
          error: new Error('Il token deve essere una stringa'),
          context,
          operation: 'delete',
        });
        return res.status(400).json({
          message: 'Il token deve essere una stringa',
        });
      }
      const result = await this.authService.deleteBannedToken(token);
      if (!result) {
        this.loggerService.logCrudSuccess(
          context,
          'delete',
          `Token non presente nei bannati: ${token}`,
        );
        return res
          .status(200)
          .json({ message: 'Token non presente nei bannati' });
      }

      this.loggerService.logCrudSuccess(
        context,
        'delete',
        `Token rimosso dai bannati: ${token}`,
      );
      return res.status(200).json({ message: 'Token sbannato' });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'delete',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel rimozione del token dai bannati',
      });
    }
  }

  /**
   * API per sbannare tutti i token inseriti su quelli bannati
   * @param req user data
   * @param res
   * @returns
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete('ban/all')
  async deleteAllBannedToken(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Ban Token',
    };
    try {
      await this.authService.clearAllBannedTokens();

      this.loggerService.logCrudSuccess(
        context,
        'delete',
        `Tutti i token rimossi dai bannati`,
      );
      return res
        .status(200)
        .json({ message: 'Tutti i token rimossi dai bannati' });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'delete',
      });

      return res.status(error.status || 500).json({
        message:
          error.message || 'Errore nel rimozione di tutti i token dai bannati',
      });
    }
  }

  /**
   * API per recuperare gli utenti attualmente loggati, con il rispettivo token
   * @param req
   * @param res
   * @returns
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('logged')
  async getLoggedUsers(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Logged Users',
    };
    try {
      const users = await this.authService.getLoggedUsers();
      if (!users?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun utente loggato',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Trovati ${users.length} utenti loggati`,
      );

      res.status(200).json(users);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero degli utenti loggati',
      });
    }
  }
}

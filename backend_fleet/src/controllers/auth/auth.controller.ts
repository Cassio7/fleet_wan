import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
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
  async logIn(@Body() body: Record<string, any>, @Res() res: any) {
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
      return res
        .status(200)
        .json({ message: 'Autenticazione riuscita', access_token });
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
  async logOut(@Req() req: Request & { user: UserFromToken }, @Res() res: any) {
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
}

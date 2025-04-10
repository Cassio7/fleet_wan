import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoggerService } from 'src/log/service/logger.service';
import { AuthService } from 'src/services/auth/auth.service';
import { extractTokenFromHeader } from 'src/utils/utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Funzione Guard che serve come middleware per validare la sessione utente
   * @param context
   * @returns
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);
    //this.loggerService.logClientData(request);
    if (!token) {
      throw new UnauthorizedException('Token non fornito.');
    }
    try {
      const user = await this.authService.validateToken(token);
      const banned = await this.authService.getBannedToken(token);
      if (banned) {
        throw new UnauthorizedException('Token utente bannato');
      }
      const userActive = await this.authService.getActive(user.key);
      if (!userActive) {
        throw new UnauthorizedException('Account disabilitato');
      }
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new ForbiddenException(error.message);
      }
      throw new ForbiddenException('Accesso non autorizzato.');
    }
  }
}

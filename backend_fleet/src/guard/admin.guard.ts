import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserService } from 'src/services/user/user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  // id Admin
  ADMIN_ROLE = 1;
  /**
   * Funzione Guard che serve come middleware controllare se utente è admin
   * @param context
   * @returns
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Utente non autenticato.');
    }
    const dbUser = await this.userService.getUserById(user.id);
    if (!dbUser) {
      throw new ForbiddenException('Utente non trovato nel database.');
    }
    if (dbUser.role.id === this.ADMIN_ROLE) return true;
    else throw new ForbiddenException('Accesso negato. Ruolo non autorizzato.');
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'classes/entities/user.entity';
import { Role } from 'classes/enum/role.enum';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { Repository } from 'typeorm';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    private reflector: Reflector,
  ) {}
  /**
   * Funzione Guard che serve come middleware controllare il ruolo di un utente e verificare se ha il permesso per 
   * accedere ad una determinata richiesta
   * @param context
   * @returns
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // recupero i ruoli passati nel decoratore, se esistono
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    // recupero richiesta e utente, impostati durante la verifica del token jwt
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Utente non autenticato.');
    }
    // 
    const dbUser = await this.userRepository.findOne({
      where: {
        id: user.id,
      },
      relations: {
        role: true,
      },
    });
    if (!dbUser) {
      throw new ForbiddenException('Utente non trovato nel database.');
    }
    if (requiredRoles.some((role) => dbUser.role.name?.includes(role)))
      return true;
    else throw new ForbiddenException('Accesso negato. Ruolo non autorizzato.');
  }
}

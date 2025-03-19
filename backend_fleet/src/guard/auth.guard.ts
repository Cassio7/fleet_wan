import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'classes/entities/user.entity';
import { LoggerService } from 'src/log/service/logger.service';
import { AuthService } from 'src/services/auth/auth.service';
import { extractTokenFromHeader } from 'src/utils/utils';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly loggerService: LoggerService,
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    @InjectRedis() private readonly redis: Redis,
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
      const key = `user:${user.id}:active`;
      let userActiveStr = await this.redis.get(key);
      if (userActiveStr === null) {
        const userDB = await this.userRepository.findOne({
          select: {
            active: true,
          },
          where: { id: user.id },
        });
        userActiveStr = userDB.active ? '1' : '0';
        // rimane su redis 30 minuti
        await this.redis.set(key, userActiveStr, 'EX', 1800);
      }
      const userActive = userActiveStr === '1';

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

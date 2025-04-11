import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'classes/entities/user.entity';
import Redis from 'ioredis';
import { IsNull, Repository } from 'typeorm';
import { JwtPayload } from './../../../node_modules/@types/jsonwebtoken/index.d';

interface LoggedUserDto {
  id: number;
  key: string;
  username: string;
  email: string;
  token: string;
  clientId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Funzione che controlla se utente esiste e se la password è corretta
   * @param username Username utente
   * @param password password utente
   * @returns ritorna il JWT token della sessione
   */
  async logIn(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.userRepository.findOne({
      where: { username: username },
      relations: {
        role: true,
      },
    });
    if (!user) {
      throw new HttpException(
        'Credenziali non valide: utente non trovato',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!user.active) {
      throw new HttpException('Account disabilitato', HttpStatus.UNAUTHORIZED);
    }
    // Verifica password
    if (!password) {
      throw new HttpException(
        'Password invalida per la comparazione',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'Credenziali non valide: password errata',
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      const payload: JwtPayload = {
        username: user.username,
        id: user.id,
        key: user.key,
        email: user.email,
        name: user.name,
        surname: user.surname,
        idR: user.role.id,
      };
      const token = await this.jwtService.signAsync(payload);
      const key = `users:${user.key}:token`;
      // Imposta il token con una scadenza di 24 ore
      await this.redis.set(key, token, 'EX', 86400);
      return {
        access_token: token,
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        `Errore durante il login utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verifica se il token è corretto
   * @param token JWT token
   * @returns true = corretto , false = NON corretto
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('SECRET_TOKEN'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpException(
          'Il token è scaduto. Effettua di nuovo accesso.',
          HttpStatus.UNAUTHORIZED,
        );
      } else if (error.name === 'JsonWebTokenError') {
        throw new HttpException(
          'Il token è invalido. Potrebbe essere stato modificato.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        'Errore di autenticazione.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * recupera da redis lo stato di un utente, se non è presente lo imposta
   * @param userKey id utente
   * @returns
   */
  async getActive(userKey: string): Promise<boolean> {
    const key = `users:${userKey}:active`;
    let userActiveStr = await this.redis.get(key);
    if (userActiveStr === null) {
      const userDB = await this.userRepository.findOne({
        select: {
          active: true,
        },
        where: { key: userKey },
      });
      userActiveStr = userDB.active ? '1' : '0';
      // rimane su redis 30 minuti
      await this.redis.set(key, userActiveStr, 'EX', 1800);
    }
    return userActiveStr === '1';
  }

  /**
   * imposta su redis lo stato di un utente
   * @param userKey key utente
   * @param active stato utente
   */
  async setActive(userKey: string, active: boolean) {
    const key = `users:${userKey}:active`;
    const userActiveStr = active ? '1' : '0';
    // rimane su redis 30 minuti
    await this.redis.set(key, userActiveStr, 'EX', 1800);
  }

  /**
   * Recupera gli utenti loggati, cioè quelli che hanno un token inserito su redis
   * @returns
   */
  async getLoggedUsers(): Promise<LoggedUserDto[]> {
    try {
      const users = await this.userRepository.find({
        where: {
          active: true,
        },
      });
      const loggedUsers: LoggedUserDto[] = [];

      for (const user of users) {
        const token = await this.getLoggedUserRedis(user.key);
        const clientId = await this.getClientRedis(user.key);
        if (token) {
          loggedUsers.push({
            id: user.id,
            key: user.key,
            username: user.username,
            email: user.email,
            token,
            clientId,
          });
        }
      }

      return loggedUsers;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante il recupero degli utenti loggati`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLoggedUsersMap(): Promise<
    Map<string, { token: string; clientId: string }>
  > {
    try {
      const users = await this.userRepository.find({
        select: {
          key: true,
        },
        where: {
          active: true,
        },
      });
      const loggedMap: Map<string, { token: string; clientId: string }> =
        new Map();
      for (const user of users) {
        const token = await this.getLoggedUserRedis(user.key);
        const clientId = await this.getClientRedis(user.key);
        if (token) {
          loggedMap.set(user.key, { token, clientId });
        }
      }
      return loggedMap;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante il recupero degli utenti loggati`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera da redis il token associato ad un utente dalla sua key
   * @param userKey chiave utente
   * @returns
   */
  private async getLoggedUserRedis(userKey: string): Promise<string | null> {
    const key = `users:${userKey}:token`;
    const token = await this.redis.get(key);
    return token;
  }

  /**
   * Recupera tutti i token bannati da redis
   * @returns array di string
   */
  async getAllBannedTokens(): Promise<string[]> {
    const key = `banned`;
    const tokens = await this.redis.smembers(key);
    return tokens;
  }

  /**
   * Controlla se il token fornito è presente su redis, quindi bannato
   * @param token token
   * @returns true o false
   */
  async getBannedToken(token: string): Promise<boolean> {
    const key = `banned`;
    const exists = await this.redis.sismember(key, token);
    return exists === 1;
  }

  /**
   * Permette di impostare su redis i token bannati redis
   * @param token token da bannare
   */
  async setBannedToken(token: string): Promise<void> {
    const key = `banned`;
    await this.redis.sadd(key, token);
  }

  /**
   * Rimuove un token dal set dei token bannati su Redis
   * @param token token da rimuovere
   * @returns true se il token è stato rimosso, false se non era presente
   */
  async deleteBannedToken(token: string): Promise<boolean> {
    const key = `banned`;
    const removed = await this.redis.srem(key, token);
    return removed === 1;
  }

  /**
   * Rimuove tutti i token dai bannati redis
   */
  async clearAllBannedTokens(): Promise<void> {
    const key = `banned`;
    await this.redis.del(key);
  }

  /**
   * Recupera da redis il client id associato all utente
   * @param userKey chiave utente
   * @returns
   */
  async getClientRedis(userKey: string): Promise<string | null> {
    const key = `users:${userKey}:client`;
    const token = await this.redis.get(key);
    return token;
  }

  /**
   * Imposta su redis il client id associato all utente connesso
   * @param userKey user key
   * @param clientId id client
   */
  async setClientIdRedis(userKey: string, clientId: string): Promise<void> {
    const key = `users:${userKey}:client`;
    await this.redis.set(key, clientId, 'EX', 86400);
  }

  /**
   * Elimina da Redis il client id associato all'utente
   * @param userKey chiave utente
   */
  async deleteClientRedis(userKey: string): Promise<void> {
    const key = `users:${userKey}:client`;
    await this.redis.del(key);
  }
}

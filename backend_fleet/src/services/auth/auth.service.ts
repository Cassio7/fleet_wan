import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'classes/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from './../../../node_modules/@types/jsonwebtoken/index.d';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
        email: user.email,
        name: user.name,
        surname: user.surname,
      };
      return {
        access_token: await this.jwtService.signAsync(payload),
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
  async validateToken(token: string) {
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
}

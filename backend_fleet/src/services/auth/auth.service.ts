import { JwtPayload } from './../../../node_modules/@types/jsonwebtoken/index.d';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
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
    const user = await this.userService.getUserByUsername(username);
    // Se l'utente non esiste
    if (!user) {
      throw new UnauthorizedException(
        'Credenziali non valide: utente non trovato',
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    // se password non uguale
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Credenziali non valide: password errata',
      );
    }
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
        throw new UnauthorizedException(
          'Il token è scaduto. Effettua di nuovo accesso.',
        );
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(
          'Il token è invalido. Potrebbe essere stato modificato.',
        );
      }
      throw new UnauthorizedException('Errore di autenticazione.');
    }
  }
}

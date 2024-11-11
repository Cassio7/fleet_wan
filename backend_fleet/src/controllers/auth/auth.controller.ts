import {
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/services/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  /**
   * Login utente
   * @param res ritorna il risultato dell'operazione
   * @param body username e password
   */
  @Post('login')
  async logIn(@Res() res: any, @Body() body: any) {
    try {
      const token = await this.authService.logIn(body.username, body.password);
      res.cookie('authorization', token, {
        httpOnly: true,
        maxAge: 3600000, // durata 1 h
        sameSite: 'Strict', // Per evitare CSRF, usa SameSite
      });
      res.status(200).send({ message: 'Login success' });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(401).send({
          statusCode: 401,
          message: 'Invalid credentials',
          error: 'Unauthorized',
        });
      } else {
        res.status(500).send({
          statusCode: 500,
          message: 'Internal Server Error',
          error: 'Internal Server Error',
        });
      }
    }
  }
/**
 * Pulisce il cookie per la sessione
 * @param res Ritorna il successo dell'operazione
 */
  @Post('logout')
  async logOut(@Res() res: any) {
    res.clearCookie('authorization', {
      httpOnly: true,
      sameSite: 'Strict',
    });
    res.status(200).send({ message: 'Logged out successfully' });
  }
}

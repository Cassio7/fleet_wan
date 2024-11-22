import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
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
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async logIn(@Body() body: Record<string, any>) {
    return await this.authService.logIn(body.username, body.password);
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

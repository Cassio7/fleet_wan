import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
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
  async logIn(@Body() body: Record<string, any>, @Res() res: any) {
    const { access_token } = await this.authService.logIn(
      body.username,
      body.password,
    );
    res.cookie('authorization', access_token, {
      httpOnly: true,
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000, // 24h
    });
    return res
      .status(200)
      .json({ message: 'Log in successfully', access_token });
  }

  /**
   * Pulisce il cookie per la sessione
   * @param res Ritorna il successo dell'operazione
   */
  @Get('logout')
  async logOut(@Res() res: any, @Req() req: any) {
    const token = req.headers['authorization']; // accedi al cookie
    console.log(token);
    if (token) {
      res.clearCookie('authorization', {
        httpOnly: true,
        sameSite: 'Strict',
      });
      return res.status(200).json({ message: 'Logged out successfully' });
    }
    return res.status(200).json({ message: 'Already logged out' }); // Se il cookie non esiste
  }
}

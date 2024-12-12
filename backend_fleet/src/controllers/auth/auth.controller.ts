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
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  /**
   * Login utente
   * @param res ritorna il risultato dell'operazione
   * @param body username e password
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async logIn(
    @Req() req: Request,
    @Body() body: Record<string, any>,
    @Res() res: any,
  ) {
    const { access_token } = await this.authService.logIn(
      body.username,
      body.password,
    );
    res.cookie('authorization', access_token, {
      httpOnly: true,
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000, // 24h
    });
    // Salvo su Redis il login utente
    const key = `user:login:${body.username}`;
    const data = {
      username: body.username,
      loginTime: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      cookie: access_token,
    };
    // 1 settimana di salvataggio su redis
    await this.redis.rpush(key, JSON.stringify(data));
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

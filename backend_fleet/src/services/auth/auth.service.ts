import { JwtPayload } from './../../../node_modules/@types/jsonwebtoken/index.d';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './../user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async logIn(username: string, password: string): Promise<any> {
    const bcrypt = require('bcrypt');
    const user = await this.userService.getUserByUsername(username);
    // Se l'utente non esiste
    if (!user) {
      throw new UnauthorizedException();
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    // se password non uguale
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload: JwtPayload = {
      username: user.username,
      id: user.id,
      email: user.email,
      role: user.user_role[0].role.name,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }
}

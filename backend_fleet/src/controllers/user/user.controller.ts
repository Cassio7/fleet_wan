import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from 'src/services/user/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * API per restituire tutti gli utenti 
   * @param res 
   */
  @Get()
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).send('Errore durante il recupero dei realtimes');
    }
  }
}

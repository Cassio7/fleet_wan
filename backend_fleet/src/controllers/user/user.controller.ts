import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { UserService } from 'src/services/user/user.service';
import { AdminGuard } from 'src/guard/admin.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * API per restituire tutti gli utenti
   * @param res
   */
  @UseGuards(AuthGuard, AdminGuard)
  @Get()
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.userService.getAllUsers();
      if (users) res.status(200).json(users);
      else res.status(404).json({ message: 'Nessun utente trovato' });
    } catch (error) {
      console.error('Errore nel recupero degli utenti:', error);
      res.status(500).json({ message: 'Errore nel recupero degli utenti' });
    }
  }

  /**
   * API per restituire un utente in base all'id
   * @param res
   * @param params id utente
   */
  @UseGuards(AuthGuard, AdminGuard)
  @Get(':id')
  async getUserById(@Res() res: Response, @Param() params: any) {
    try {
      const users = await this.userService.getUserById(params.id);
      if (users) res.status(200).json(users);
      else res.status(404).json({ message: 'Utente non trovato' });
    } catch (error) {
      console.error("Errore nel recupero dell'utente:", error);
      res.status(500).json({ message: "Errore nel recupero dell'utente" });
    }
  }

  /**
   * API per restituire un utente in base all'username
   * @param res
   * @param body username utente
   */
  @UseGuards(AuthGuard, AdminGuard)
  @Post('username')
  async getUserByUsername(@Res() res: Response, @Body() body: any) {
    try {
      const users = await this.userService.getUserByUsername(body.username);
      if (users) res.status(200).json(users);
      else res.status(404).json({ message: 'Utente non trovato' });
    } catch (error) {
      console.error("Errore nel recupero dell'utente:", error);
      res.status(500).json({ message: "Errore nel recupero dell'utente" });
    }
  }
}

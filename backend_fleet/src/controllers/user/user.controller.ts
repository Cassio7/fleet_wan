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
import { RolesGuard } from 'src/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'classes/enum/role.enum';
import { UserDTO } from 'classes/dtos/user.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('user')
@Roles(Role.Admin)
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
  @Get(':id')
  async getUserById(@Res() res: Response, @Param() params: any) {
    try {
      const user = await this.userService.getUserById(params.id);
      if (user) {
        const userDTO = new UserDTO();
        userDTO.email = user.email;
        userDTO.name = user.name;
        userDTO.surname = user.surname;
        userDTO.username = user.username;
        userDTO.role = user.role.name;
        res.status(200).json(userDTO);
      } else res.status(404).json({ message: 'Utente non trovato' });
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
  @Post('username')
  async getUserByUsername(@Res() res: Response, @Body() body: any) {
    try {
      const user = await this.userService.getUserByUsername(body.username);
      if (user) {
        const userDTO = new UserDTO();
        userDTO.email = user.email;
        userDTO.name = user.name;
        userDTO.surname = user.surname;
        userDTO.username = user.username;
        userDTO.role = user.role.name;
        res.status(200).json(userDTO);
      } else res.status(404).json({ message: 'Utente non trovato' });
    } catch (error) {
      console.error("Errore nel recupero dell'utente:", error);
      res.status(500).json({ message: "Errore nel recupero dell'utente" });
    }
  }
}

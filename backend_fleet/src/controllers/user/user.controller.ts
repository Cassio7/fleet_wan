import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { RoleService } from 'src/services/role/role.service';
import { UserEntity } from 'classes/entities/user.entity';

@UseGuards(AuthGuard, RolesGuard)
@Controller('user')
@Roles(Role.Admin)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

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
   * API per la creazione di un nuovo utente
   * @param res
   * @param body
   */
  @Post()
  async createUser(@Res() res: Response, @Body() userDTO: UserDTO) {
    try {
      const exist = await this.userService.getUserByUsername(userDTO.username);
      const role = await this.roleService.getRoleByName(userDTO.role);
      if (!exist) {
        if (role) {
          const user = await this.userService.createUser(userDTO, role);
          console.log('Utente con username: ' + user.username + ' salvato!');
          const userDTOfinal = new UserDTO();
          userDTOfinal.email = user.email;
          userDTOfinal.name = user.name;
          userDTOfinal.surname = user.surname;
          userDTOfinal.username = user.username;
          userDTOfinal.role = user.role.name;
          res.status(200).json(userDTOfinal);
        } else {
          res.status(404).json({ message: 'Ruolo non trovato' });
        }
      } else {
        res.status(409).json({ message: 'Username esistente' });
      }
    } catch (error) {
      console.error('Errore nella registrazione del nuovo utente:', error);
      res
        .status(500)
        .json({ message: 'Errore nella registrazione del nuovo utente' });
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
   * API per aggiornare i dati dell'utente, utente con username Admin non puo essere aggiornato
   * @param res
   * @param params username utente
   * @param userDTO nuovi dati dal body
   */
  @Put(':username')
  async updateUserByUsername(
    @Res() res: Response,
    @Param() params: any,
    @Body() userDTO: UserDTO,
  ) {
    try {
      const user = await this.userService.getUserByUsername(
        params.username.toLowerCase(),
      );
      if (user.username === 'Admin') {
        res
          .status(401)
          .json({ message: 'Utente Admin non puo essere eliminato' });
      } else {
        if (user) {
          const role = await this.roleService.getRoleByName(userDTO.role);
          if (role) {
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(userDTO.password, salt);
            const updateUser = {
              email: userDTO.email,
              name: userDTO.name,
              surname: userDTO.surname,
              password: hashPassword,
              role: role,
            };
            await this.userService.updateUser(user.key, updateUser);
            console.log(
              'Utente con username: ' +
                params.username.toLowerCase() +
                ' aggiornato!',
            );
            res.status(200).json(userDTO);
          } else res.status(404).json({ message: 'Ruolo non trovato' });
        } else res.status(404).json({ message: 'Utente non trovato' });
      }
    } catch (error) {
      console.error('Errore aggiornamento utente:', error);
      res.status(500).json({ message: 'Errore aggiornamento utente' });
    }
  }
  /**
   * API per eliminazione dell utente, utente con username admin non può essere eliminato
   * @param res
   * @param params username utente
   */
  @Delete(':username')
  async deleteUserByUsername(@Res() res: Response, @Param() params: any) {
    try {
      const user = await this.userService.getUserByUsername(
        params.username.toLowerCase(),
      );
      if (user.username === 'Admin') {
        res
          .status(401)
          .json({ message: 'Utente Admin non puo essere eliminato' });
      } else {
        if (user) {
          await this.userService.deleteUser(user);
          console.log(
            'Utente con username: ' +
              params.username.toLowerCase() +
              ' eliminato!',
          );
          res.status(200).json({
            message:
              'Utente con username: ' +
              params.username.toLowerCase() +
              ' eliminato!',
          });
        } else res.status(404).json({ message: 'Utente non trovato' });
      }
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
      const user = await this.userService.getUserByUsername(
        body.username.toLowerCase(),
      );
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

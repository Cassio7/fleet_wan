import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserDTO } from 'classes/dtos/user.dto';
import { UserEntity } from 'classes/entities/user.entity';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { RoleService } from 'src/services/role/role.service';
import { UserService } from 'src/services/user/user.service';
import { Repository } from 'typeorm';

@UseGuards(AuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  /**
   * API per restituire tutti gli utenti
   * @param res
   */
  @Roles(Role.Admin)
  @Get()
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.userService.getAllUsers();
      if (!users)
        return res.status(404).json({ message: 'Nessun utente trovato' });
      res.status(200).json(users);
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
  @Roles(Role.Admin)
  @Post()
  async createUser(@Res() res: Response, @Body() userDTO: UserDTO) {
    try {
      const regex = /\d/;
      if (!userDTO.username || regex.test(userDTO.username))
        return res.status(404).json({
          message:
            'Inserisci un username valido, non vuoto e non devono esserci numeri',
        });
      const exist = await this.userService.getUserByUsername(userDTO.username);
      const role = await this.roleService.getRoleByName(userDTO.role);
      if (exist)
        return res
          .status(409)
          .json({ message: 'Username esistente, scegline un altro' });
      if (!role) return res.status(404).json({ message: 'Ruolo non trovato' });
      const user = await this.userService.createUser(userDTO, role);
      console.log('Utente con username: ' + user.username + ' salvato!');
      res
        .status(200)
        .json({ message: `Utente con username ${user.username} salvato!` });
    } catch (error) {
      console.error('Errore nella registrazione del nuovo utente:', error);
      res
        .status(500)
        .json({ message: 'Errore nella registrazione del nuovo utente' });
    }
  }

  /**
   * API per restituire le informazioni relative all'utente in base al token JWT fornito
   * @param req token JWT recuperato
   * @param res
   */
  @Roles(Role.Admin, Role.Capo, Role.Responsabile)
  @Get('me')
  async getMyProfile(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    try {
      const user = await this.userService.getUserById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Utente non trovato' });
      return res.status(200).json(user);
    } catch (error) {
      console.error("Errore nel recupero dell'utente:", error);
      res.status(500).json({ message: "Errore nel recupero dell'utente" });
    }
  }

  /**
   * API  per cambiare le infromazioni utente in base al token JWT fornito
   * @param res
   * @param req Prendo user loggato
   * @param userDTO Nuovi dati aggiornati
   * @returns
   */
  @Roles(Role.Admin, Role.Capo, Role.Responsabile)
  @Put('me')
  async updateProfile(
    @Res() res: Response,
    @Req() req: Request & { user: UserFromToken },
    @Body() userDTO: UserDTO,
  ) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: req.user.id,
        },
      });
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }
      const updateUser = {
        email: userDTO.email || user.email,
        name: userDTO.name || user.name,
        surname: userDTO.surname || user.surname,
      };
      await this.userService.updateUser(user.key, updateUser);
      res.status(200).json({ message: 'Profilo aggiornato con successo' });
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'utente:", error);
      res
        .status(500)
        .json({ message: "Errore nell'aggiornamento dell'utente" });
    }
  }
  /**
   * API per cambiare la password di un utente in base al token JWT fornito
   * @param res
   * @param req Prendo user loggato
   * @param body vecchia password e la nuova password
   */
  @Roles(Role.Admin, Role.Capo, Role.Responsabile)
  @Put('me/password')
  async updatePassword(
    @Res() res: Response,
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: req.user.id,
        },
      });
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }
      const bcrypt = require('bcrypt');
      const isPasswordMatch = await bcrypt.compare(
        body.currentPassword,
        user.password,
      );
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Password attuale errata' });
      }
      if (
        body.currentPassword.toLowerCase() === body.newPassword.toLowerCase()
      ) {
        return res
          .status(400)
          .json({ message: 'Password attuale uguale alla precedente!' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(body.newPassword, salt);
      await this.userService.updateUser(user.key, { password: hashPassword });
      res.status(200).json({ message: 'Password aggiornata con successo' });
    } catch (error) {
      console.error('Errore nel cambio della password:', error);
      res.status(500).json({ message: 'Errore nel cambio della password' });
    }
  }
  /**
   * API per restituire un utente in base all'id
   * @param res
   * @param params id utente
   */
  @Roles(Role.Admin)
  @Get(':id')
  @UsePipes(ParseIntPipe)
  async getUserById(@Res() res: Response, @Param() params: any) {
    try {
      const user = await this.userService.getUserById(params.id);
      if (!user) return res.status(404).json({ message: 'Utente non trovato' });
      res.status(200).json(user);
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
  @Roles(Role.Admin)
  @Put(':id')
  @UsePipes(ParseIntPipe)
  async updateUserById(
    @Res() res: Response,
    @Param() params: any,
    @Body() userDTO: UserDTO,
  ) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: params.id,
        },
      });
      if (!user) return res.status(404).json({ message: 'Utente non trovato' });
      if (user.username === 'admin')
        return res
          .status(401)
          .json({ message: 'Utente Admin non puo essere aggiornato' });
      const role = await this.roleService.getRoleByName(userDTO.role);
      if (!role) return res.status(404).json({ message: 'Ruolo non trovato' });
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(userDTO.password, salt);
      const regex = /\d/;
      if (!userDTO.username || regex.test(userDTO.username))
        return res.status(404).json({
          message:
            'Inserisci un username valido, non vuoto e non devono esserci numeri',
        });
      const updateUser = {
        username: userDTO.username,
        email: userDTO.email,
        name: userDTO.name,
        surname: userDTO.surname,
        password: hashPassword,
        role: role,
      };
      await this.userService.updateUser(user.key, updateUser);
      console.log(
        `Utente con username ${userDTO.username || user.username} aggiornato!`,
      );
      res.status(200).json({
        message: `Utente con username ${
          userDTO.username || user.username
        } aggiornato!`,
      });
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
  @Roles(Role.Admin)
  @Delete(':id')
  @UsePipes(ParseIntPipe)
  async deleteUserById(@Res() res: Response, @Param() params: any) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: params.id,
        },
      });
      if (!user) return res.status(404).json({ message: 'Utente non trovato' });
      if (user.username === 'admin')
        return res
          .status(401)
          .json({ message: 'Utente Admin non puo essere eliminato' });
      await this.userService.deleteUser(user);
      console.log(`Utente con username ${user.username} eliminato!`);
      res.status(200).json({
        message: `Utente con username ${user.username} eliminato!`,
      });
    } catch (error) {
      console.error("Errore nell'eliminazione dell'utente:", error);
      res.status(500).json({ message: "Errore nell'eliminazione dell'utente" });
    }
  }

  /**
   * API per restituire un utente in base all'username
   * @param res
   * @param body username utente
   */
  @Roles(Role.Admin)
  @Post('username')
  async getUserByUsername(@Res() res: Response, @Body() body: any) {
    try {
      const user = await this.userService.getUserByUsername(
        body.username.toLowerCase(),
      );
      if (!user) return res.status(404).json({ message: 'Utente non trovato' });
      res.status(200).json(user);
    } catch (error) {
      console.error("Errore nel recupero dell'utente:", error);
      res.status(500).json({ message: "Errore nel recupero dell'utente" });
    }
  }
}

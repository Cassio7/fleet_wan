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
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { UserService } from 'src/services/user/user.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per restituire tutti gli utenti solo admin
   * @param req user token data
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Get()
  async getAllUsers(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Users (admin)',
    };

    try {
      const users = await this.userService.getAllUsers();

      if (!users?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun utente trovato',
        );
        return res.status(404).json({
          message: 'Nessun utente trovato',
        });
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Trovati ${users.length} utenti`,
      );
      return res.status(200).json(users);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero utenti',
      });
    }
  }

  /**
   * API per la creazione di un nuovo utente
   * @param req user token data
   * @param res
   * @param userDTO dati utente
   * @returns
   */
  @Roles(Role.Admin)
  @Post()
  async createUser(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() userDTO: UserDTO,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Users (admin)',
    };

    try {
      const user = await this.userService.createUser(userDTO);

      this.loggerService.logCrudSuccess(
        context,
        'create',
        `Utente con username ${user.username} salvato!`,
      );

      return res
        .status(200)
        .json({ message: `Utente con username ${user.username} salvato!` });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'create',
      });

      return res
        .status(500)
        .json({ message: 'Errore nella registrazione del nuovo utente' });
    }
  }

  /**
   * API per restituire le informazioni relative all'utente in base al token JWT fornito
   * @param req user token data
   * @param res
   * @returns
   */
  @Roles(Role.Admin, Role.Capo, Role.Responsabile)
  @Get('me')
  async getMyProfile(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'User',
    };

    try {
      const user = await this.userService.getUserById(req.user.id);

      if (!user) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Profilo utente non trovato',
        );
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Profilo utente trovato per ${user.username}`,
      );
      return res.status(200).json(user);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res
        .status(500)
        .json({ message: "Errore nel recupero dell'utente" });
    }
  }

  /**
   * API per restituire un utente in base all'id, solo admin
   * @param req user token data
   * @param res
   * @param userId id utente
   * @returns
   */
  @Roles(Role.Admin)
  @Get(':id')
  @UsePipes(ParseIntPipe)
  async getUserById(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id') userId: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'User (admin)',
      resourceId: userId,
    };

    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Utente non trovato',
        );
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Utente trovato con ID ${userId}`,
      );
      return res.status(200).json(user);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res
        .status(500)
        .json({ message: "Errore nel recupero dell'utente" });
    }
  }

  /**
   * API per aggiornare i dati dell'utente, utente con username Admin non puo essere aggiornato
   * @param req user token data
   * @param res
   * @param userId user id
   * @param userDTO nuovi dati utente
   * @returns
   */
  @Roles(Role.Admin)
  @Put(':id')
  @UsePipes(ParseIntPipe)
  async updateUserById(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id') userId: number,
    @Body() userDTO: UserDTO,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'User (admin)',
      resourceId: userId,
    };

    try {
      await this.userService.updateUserForAdmin(userId, userDTO);

      this.loggerService.logCrudSuccess(
        context,
        'update',
        `Utente con username ${userDTO.username} aggiornato!`,
      );
      return res.status(200).json({
        message: `Utente con username ${userDTO.username} aggiornato!`,
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'update',
      });

      return res.status(500).json({ message: 'Errore aggiornamento utente' });
    }
  }

  /**
   * API per eliminazione dell utente, utente con username admin non può essere eliminato
   * @param req user token data
   * @param res
   * @param userId user id
   * @returns
   */
  @Roles(Role.Admin)
  @Delete(':id')
  @UsePipes(ParseIntPipe)
  async deleteUserById(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id') userId: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Users (admin)',
      resourceId: userId,
    };

    try {
      await this.userService.deleteUser(userId);

      this.loggerService.logCrudSuccess(
        context,
        'delete',
        `Utente con id ${userId} eliminato`,
      );

      return res.status(200).json({
        message: `Utente con id ${userId} eliminato!`,
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'delete',
      });

      return res.status(error.status || 500).json({
        message: error.message || "Errore nell'eliminazione dell'utente",
      });
    }
  }

  /**
   * API per restituire un utente in base all'username
   * @param req user token data
   * @param res
   * @param body username user
   * @returns
   */
  @Roles(Role.Admin)
  @Post('username')
  async getUserByUsername(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() body: any,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Users (admin)',
    };

    try {
      const user = await this.userService.getUserByUsername(
        body.username.toLowerCase(),
      );

      if (!user) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Utente non trovato',
        );
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Utente trovato con username: ${user.username}`,
      );

      return res.status(200).json(user);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || "Errore nel recupero dell'utente",
      });
    }
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { NotesService } from 'src/services/notes/notes.service';
import { NoteDto } from 'classes/dtos/note.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('notes')
export class NotesController {
  private logger = new Logger(NotesController.name);
  constructor(private readonly notesService: NotesService) {}

  /**
   * API per recuperare le note associate all'utente loggato
   * @param req utente loggato
   * @param res
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Get()
  async getAllNotesByUser(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    try {
      const notes = await this.notesService.getAllNotesByUser(req.user.id);
      if (!notes || notes.length === 0) {
        this.logger.warn(`Nessuna nota trovata: UserID: ${req.user.id}`);
        return res.status(404).json({ message: 'Nessuna nota trovata' });
      }
      this.logger.log(
        `Tutte le note sono state recuperate: UserID: ${req.user.id}`,
      );
      return res.status(200).json(notes);
    } catch (error) {
      const log = 'Note non recuperate:';
      if (error.status && error.status < 500) {
        this.logger.warn(
          `${log} UserID: ${req.user.id}, Message: ${error.message}`,
        );
      } else {
        this.logger.error(
          `${log} UserID: ${req.user.id}`,
          error.stack || error.message,
        );
      }
      res
        .status(error.status || 500)
        .json({ message: error.message || 'Errore recupero nota' });
    }
  }

  /**
   * API per prendere tutte le note salvate nel db solo admin
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Get('admin')
  async getAllNotes(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    try {
      const notes = await this.notesService.getAllNotes();
      if (!notes || notes.length === 0) {
        this.logger.warn(`Nessuna nota trovata admin: UserID: ${req.user.id}`);
        return res.status(404).json({ message: 'Nessuna nota trovata' });
      }
      this.logger.log(
        `Tutte le note sono state recuperate admin: UserID: ${req.user.id}`,
      );
      return res.status(200).json(notes);
    } catch (error) {
      const log = 'Note non recuperate admin:';
      if (error.status && error.status < 500) {
        this.logger.warn(
          `${log} UserID: ${req.user.id}, Message: ${error.message}`,
        );
      } else {
        this.logger.error(
          `${log} UserID: ${req.user.id}`,
          error.stack || error.message,
        );
      }
      res
        .status(error.status || 500)
        .json({ message: error.message || 'Errore recupero nota' });
    }
  }

  /**
   * API per la creazione di una nuova nota
   * @param req per recuperare utente e lista veicoli
   * @param body il veId del veicolo e il contenuto del messaggio
   * @param res
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Post()
  async createNote(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { veId: number; content: string },
    @Res() res: Response,
  ) {
    try {
      const log = 'Nota creata con successo!';
      const veId = Number(body.veId); // Garantisce che veId sia un numero

      if (isNaN(veId)) {
        return res
          .status(400)
          .json({ message: 'Il veId deve essere un numero valido' });
      }
      await this.notesService.createNote(req.user.id, veId, body.content);
      this.logger.log(
        `${log}: UserID: ${req.user.id}, Contenuto: ${body.content}`,
      );
      return res.status(200).json({ message: log });
    } catch (error) {
      const log = 'Nota non creata:';
      if (error.status && error.status < 500) {
        this.logger.warn(
          `${log} UserID: ${req.user.id}, Message: ${error.message}`,
        );
      } else {
        this.logger.error(
          `${log} UserID: ${req.user.id}`,
          error.stack || error.message,
        );
      }
      res
        .status(error.status || 500)
        .json({ message: error.message || 'Errore creazione nota' });
    }
  }

  /**
   * API per aggiornare una nota dato un utente e id della nota
   * @param req utente loggato
   * @param noteId id della nota
   * @param body contenuto da aggiornare
   * @param res
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Put(':id')
  async updateNote(
    @Req() req: Request & { user: UserFromToken },
    @Param('id') noteId: number,
    @Body() body: NoteDto,
    @Res() res: Response,
  ) {
    try {
      const log = 'Nota aggiornata con successo!';
      await this.notesService.updateNote(req.user.id, noteId, body.content);
      this.logger.log(
        `${log}: UserID: ${req.user.id}, NoteID: ${noteId}, Contenuto: ${body.content}`,
      );
      return res.status(200).json({ message: log });
    } catch (error) {
      const log = 'Nota non aggiornata:';
      if (error.status && error.status < 500) {
        this.logger.warn(
          `${log} UserID: ${req.user.id}, NoteID: ${noteId}, Message: ${error.message}`,
        );
      } else {
        this.logger.error(
          `${log} UserID: ${req.user.id}, NoteID: ${noteId}`,
          error.stack || error.message,
        );
      }
      res
        .status(error.status || 500)
        .json({ message: error.message || 'Errore aggiornamento nota' });
    }
  }

  /**
   * API per eliminare una nota, se utente è admin può eliminare tutte, se user normale può
   * eliminare solo quelle create da lui
   * @param req utente loggato
   * @param noteId id della nota
   * @param res
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Delete(':id')
  @UsePipes(ParseIntPipe)
  async deleteNote(
    @Req() req: Request & { user: UserFromToken },
    @Param('id') noteId: number,
    @Res() res: Response,
  ) {
    try {
      const log = 'Nota eliminata con successo!';
      await this.notesService.deleteNote(req.user.id, noteId);
      this.logger.log(`${log}: UserID: ${req.user.id}, NoteID: ${noteId}`);
      return res.status(200).json({ message: log });
    } catch (error) {
      const log = 'Nota non eliminata:';
      if (error.status && error.status < 500) {
        this.logger.warn(
          `${log} UserID: ${req.user.id}, NoteID: ${noteId}, Message: ${error.message}`,
        );
      } else {
        this.logger.error(
          `${log} UserID: ${req.user.id}, NoteID: ${noteId}`,
          error.stack || error.message,
        );
      }
      res
        .status(error.status || 500)
        .json({ message: error.message || 'Errore eliminazione nota' });
    }
  }
}

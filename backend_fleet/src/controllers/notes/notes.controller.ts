import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { NoteDto } from 'src/classes/dtos/note.dto';
import { Role } from 'src/classes/enum/role.enum';
import { UserFromToken } from 'src/classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { NotesService } from 'src/services/notes/notes.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly loggerService: LoggerService,
  ) {}

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
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notes',
    };

    try {
      const notes = await this.notesService.getAllNotesByUser(req.user.id);

      if (!notes?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna nota trovata',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate ${notes.length} note`,
      );
      return res.status(200).json(notes);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero nota',
      });
    }
  }

  /**
   * API per il recupero della nota associata all'utente loggato ed in base al veid passato nel body
   * @param req user data
   * @param body veId identificativo del veicolo
   * @param res
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Get('veId')
  async getNoteByVeid(
    @Req() req: Request & { user: UserFromToken },
    @Query('veId', ParseIntPipe) veId: number,
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notes',
      resourceId: veId,
    };

    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    try {
      const note = await this.notesService.getNoteByVeId(req.user.id, veId);
      if (!note) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          `Nessuna nota recuperata`,
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperata la nota id: ${note.id}`,
      );
      return res.status(200).json(note);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero nota',
      });
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
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notes (admin)',
    };

    try {
      const notes = await this.notesService.getAllNotes();

      if (!notes?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna nota trovata',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate tutte le note (${notes.length})`,
      );
      return res.status(200).json(notes);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero note',
      });
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
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notes',
    };

    try {
      const veId = Number(body.veId); // Garantisce che veId sia un numero

      if (isNaN(veId)) {
        this.loggerService.logCrudError({
          error: new Error('Il veId deve essere un numero valido'),
          context,
          operation: 'create',
        });
        return res.status(400).json({
          message: 'Il veId deve essere un numero valido',
        });
      }

      const note = await this.notesService.createNote(
        req.user.id,
        veId,
        body.content,
      );

      this.loggerService.logCrudSuccess(
        context,
        'create',
        `Nota creata con successo: veId = ${veId}, Contenuto = ${body.content}`,
      );

      return res.status(200).json(note);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'create',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore creazione nota',
      });
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
    @Param('id', ParseIntPipe) noteId: number,
    @Body() body: NoteDto,
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notes',
      resourceId: noteId,
    };

    try {
      await this.notesService.updateNote(req.user.id, noteId, body.content);

      this.loggerService.logCrudSuccess(
        context,
        'update',
        `Nota aggiornata con successo: NoteID = ${noteId}, Contenuto = ${body.content}`,
      );

      return res.status(200).json({
        message: 'Nota aggiornata con successo!',
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'update',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore aggiornamento nota',
      });
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
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Notes',
      resourceId: noteId, // ID della nota da eliminare
    };

    try {
      await this.notesService.deleteNote(req.user.id, noteId);

      this.loggerService.logCrudSuccess(
        context,
        'delete',
        `Nota eliminata con successo: NoteID = ${noteId}`,
      );

      return res.status(200).json({
        message: 'Nota eliminata con successo!',
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'delete',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore eliminazione nota',
      });
    }
  }
}

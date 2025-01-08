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
      if (!notes || notes.length === 0)
        return res.status(404).json({ message: 'Nessuna nota trovata' });
      return res.status(200).json(notes);
    } catch (error) {
      console.error('Errore nel recupero delle note:', error.message);
      res
        .status(500)
        .json({ message: 'Errore nel recupero delle note ' + error.message });
    }
  }

  /**
   * API per prendere tutte le note salvate nel db solo admin
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Get('admin')
  async getAllNotes(@Res() res: Response) {
    try {
      const notes = await this.notesService.getAllNotes();
      if (!notes || notes.length === 0)
        return res.status(404).json({ message: 'Nessuna nota trovata' });
      return res.status(200).json(notes);
    } catch (error) {
      console.error('Errore nel recupero delle note:', error.message);
      res
        .status(500)
        .json({ message: 'Errore nel recupero delle note ' + error.message });
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
      const veId = Number(body.veId); // Garantisce che veId sia un numero

      if (isNaN(veId)) {
        return res
          .status(400)
          .json({ message: 'veId deve essere un numero valido' });
      }
      await this.notesService.createNote(req.user.id, veId, body.content);
      return res.status(200).json({ message: 'Nota creata con successo!' });
    } catch (error) {
      console.error(
        'Errore nella registrazione della nuova nota:',
        error.message,
      );
      res.status(500).json({
        message:
          'Errore nella registrazione della nuova nota: ' + error.message,
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
    @Param('id') noteId: number,
    @Body() body: NoteDto,
    @Res() res: Response,
  ) {
    try {
      await this.notesService.updateNote(req.user.id, noteId, body.content);
      return res.status(200).json({ message: 'Nota aggiornata con successo!' });
    } catch (error) {
      console.error("Errore nell'aggiornamento della nota:", error.message);
      res.status(500).json({
        message: "Errore nell'aggiornamento della nota: " + error.message,
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
  ) {
    try {
      await this.notesService.deleteNote(req.user.id, noteId);
      return res.status(200).json({ message: 'Nota eliminata con successo!' });
    } catch (error) {
      console.error("Errore nell'eliminazione della nota:", error.message);
      res.status(500).json({
        message: "Errore nell'eliminazone della nota: " + error.message,
      });
    }
  }
}

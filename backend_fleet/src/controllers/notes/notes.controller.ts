import { Controller, Post, Body, Get, Param, Put, Delete, Res } from '@nestjs/common';
import { NoteDto } from 'classes/dtos/note.dto';
import { NotesService } from 'src/services/notes/notes.service';

@Controller('notes')
export class NotesController {
    constructor(private readonly notesService: NotesService) {}

    /**
     * Prende tutte le note salvate nel db
     * @param res 
     * @returns 
     */
    @Get('/all')
    async getAllNotes(@Res() res: any){
        const notes = await this.notesService.getAllNotes();
        return notes ? res.status(200).json(notes) : res.status(200).send("Errore nella ricerca di tutte le note");
    }
    
    /*OPERAZIONI CRUD */
    /**
     * Crea una nuova nota
     * @param noteDto - The data to create a new note
     * @returns The created note entity
     */
    @Post('/create')
    async create(@Body() noteDto: NoteDto, @Res() res: any) {
        return res.json(this.notesService.createNote(noteDto));
    }

    /**
     * Aggiorna una nota esistente
     * @param body corpo della richiesta
     * @param res 
     * @returns 
     */
    @Post("/update")
    update(@Body() body: any, @Res() res){
        const vehicleId = body.vehicleId;
        const userId = body.userId;
        const newContent = body.content;

        return res.json(this.notesService.updateNote(userId, vehicleId, newContent));
    }

    /**
     * Elimina una nota
     * @param params id della nota da cancellare
     * @param res 
     * @returns 
     */
    @Post('/delete/:id')
    async delete(@Param() params: any, @Res() res){
        const noteId = params.id;
        return res.json(this.notesService.deleteNote(noteId));
    }

}

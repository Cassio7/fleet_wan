import { Controller, Post, Body, Get, Param, Put, Delete, Res } from '@nestjs/common';
import { NoteDto } from 'classes/dtos/note.dto';
import { NotesService } from 'src/services/notes/notes.service';

@Controller('notes')
export class NotesController {
    constructor(private readonly notesService: NotesService) {}

    /**
     * Crea una nuova nota
     * @param noteDto - The data to create a new note
     * @returns The created note entity
     */
    @Post('/create')
    async create(@Body() noteDto: NoteDto, @Res() res) {
        return res.send(this.notesService.createNote(noteDto));
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

        return res.send(this.notesService.updateNote(userId, vehicleId, newContent));
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
        return res.send(this.notesService.deleteNote(noteId));
    }
}

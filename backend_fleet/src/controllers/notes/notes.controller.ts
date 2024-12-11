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

    @Post("update")
    update(@Body() body: any, @Res() res){
        const noteId = body.id;
        const content = body.content;

        return res.send(this.notesService.updateNote(noteId, content));
    }

    @Post('/delete/:id')
    async delete(@Param() params: any, @Res() res){
        const noteId = params.id;
        return res.send(this.notesService.deleteNote(noteId));
    }
}

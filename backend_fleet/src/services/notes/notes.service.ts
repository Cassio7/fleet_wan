import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { NoteDto } from 'classes/dtos/note.dto';
import { NoteEntity } from 'classes/entities/note.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';  // For better error handling

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NoteEntity, 'readOnlyConnection')
    private readonly noteRepository: Repository<NoteEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource
  ) {}

  /**
   * Crea una nuova nota e la immagazzina nel database
   * @param noteDto - DTO della nota
   * @returns l'entità "Nota" creata
   */
  async createNote(noteDto: NoteDto){
    const { content, vehicleId, userId } = noteDto;
    const queryRunner = this.connection.createQueryRunner();

    try {
        // Interruzione dell'esecuzone se almeno uno dei parametri non viene trovato
        if (!content || !vehicleId || !userId) {
            return false; 
        }
    
        await queryRunner.startTransaction();
    
        const vehicle = await queryRunner.manager.findOne(VehicleEntity, { where: { veId: vehicleId } }); //ricerca del veicolo
    
        const user = await queryRunner.manager.findOne(UserEntity, { where: { id: userId } }); //ricerca dell'utente
    
        // Interruzione dell'esecuzone se veicolo o utente non trovati
        if (!vehicle || !user) {
            console.error('Vehicle or User not found:', { vehicle, user });
            throw new Error('Invalid vehicleId or userId');
        }
    
        //creazione della nuova nota 
        const newNote = queryRunner.manager.getRepository(NoteEntity).create({
            content: content,
            vehicle: vehicle,  
            user: user,  
        });
        await queryRunner.manager.getRepository(NoteEntity).save(newNote); //Inserimento della nota nel DB
    
        await queryRunner.commitTransaction();
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('Error during transaction:', error);
        throw error;  
    } finally {
        await queryRunner.release();
    }
  }

  /**
   * Modifica il contenuto di una nota
   * @param noteId id della nota da modificare
   * @param updatedContent contenuto modificato
   */
  async updateNote(noteId: number, updatedContent: string){
    const queryRunner = this.connection.createQueryRunner();

    try{
        //interruzione dell'esecuzione se parametro non trovato
        if(!noteId){
            throw new Error('Invalid note id');
        }


        await queryRunner.manager.update(NoteEntity, noteId, { content: updatedContent });
    }catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('Error during transaction:', error);
        throw error;  
    } finally {
        await queryRunner.release();
    }
  }

  /**
   * Elimina una nota
   * @param noteId id della nota da eliminare
   */
  async deleteNote(noteId: number){
    const queryRunner = this.connection.createQueryRunner();
    try{
        queryRunner.startTransaction();

        //interruzione dell'esecuzione se parametro non trovato
        if(!noteId){
            throw new Error('Invalid note id');
        }

        const note = await queryRunner.manager.findOne(NoteEntity, { where: { id: noteId }}); //ricerca della nota in base all'id

        queryRunner.manager.remove(note); //rimozione della nota

        await queryRunner.commitTransaction();
    }catch(error){
        await queryRunner.rollbackTransaction();
        console.error('Error during transaction:', error);
        throw error;  
    }finally{
        queryRunner.release();
    }
  }
}

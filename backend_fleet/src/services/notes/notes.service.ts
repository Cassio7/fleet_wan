import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { NoteDto } from 'classes/dtos/note.dto';
import { UserDTO } from 'classes/dtos/user.dto';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { NoteEntity } from 'classes/entities/note.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { DataSource, In, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';
import { UserService } from '../user/user.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NoteEntity, 'readOnlyConnection')
    private readonly noteRepository: Repository<NoteEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly associationService: AssociationService,
    private readonly userService: UserService,
  ) {}

  /**
   * Permette di recuperare tutte le note di ogni veicolo di ogni utente, funzione admin
   * @returns
   */
  async getAllNotes(): Promise<NoteDto[]> {
    try {
      const notes = await this.noteRepository.find({
        relations: {
          vehicle: true,
          user: true,
        },
        order: {
          vehicle: {
            plate: 'ASC',
          },
        },
      });
      return notes.map((note) => this.toDTO(note));
    } catch (error) {
      throw new HttpException(
        `Errore durante recupero delle note admin`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Permette di recuperare tutte le note di ogni veicolo in base all'utente che fa la richiesta
   * @param userId id utente
   * @returns
   */
  async getAllNotesByUser(userId: number): Promise<NoteDto[]> {
    const vehicles = (await this.associationService.getVehiclesByUserRole(
      userId,
    )) as VehicleEntity[];
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    try {
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const veIdArray = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];
      const notes = await this.noteRepository.find({
        relations: {
          vehicle: true,
          user: true,
        },
        where: {
          vehicle: {
            veId: In(veIdArray),
          },
          user: {
            id: userId,
          },
        },
        order: {
          vehicle: {
            plate: 'ASC',
          },
        },
      });
      return notes.map((note) => this.toDTO(note));
    } catch (error) {
      throw new HttpException(
        `Errore durante recupero delle note`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Permette di creare una nuova nota, associata ad un utente ed un veicolo
   * @param userId id utente
   * @param veId veId identificativo veicolo
   * @param content contenuto della nota
   */
  async createNote(userId: number, veId: number, content: string) {
    if (!content || content.trim().length === 0) {
      throw new HttpException(
        'Il contenuto della nota non può essere vuoto',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (content.length > 500) {
      throw new HttpException(
        'Il contenuto della nota supera il limite di 500 caratteri',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userService.checkUser(userId);

    const vehicles = (await this.associationService.getVehiclesByUserRole(
      userId,
    )) as VehicleEntity[];
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );

    const vehicle = vehicles.find((v) => v.veId === veId);
    if (!vehicle)
      throw new HttpException(
        'Non hai i permessi per creare una nota per questo veicolo',
        HttpStatus.FORBIDDEN,
      );

    const existNote = await this.noteRepository.findOne({
      where: {
        vehicle: {
          veId: vehicle.veId,
        },
        user: {
          id: user.id,
        },
      },
    });
    if (existNote)
      throw new HttpException(
        `Hai già creato una nota per questo veicolo, non puoi crearne un'altra`,
        HttpStatus.CONFLICT,
      );

    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const newNote = queryRunner.manager.getRepository(NoteEntity).create({
        content: content,
        vehicle: vehicle,
        user: user,
      });
      await queryRunner.manager.getRepository(NoteEntity).save(newNote);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        'Errore durante la creazione della nota',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Modifica il contenuto di una nota, un utente può aggiorare soltanto una nota creata da lui,
   * un admin può modificare una qualsiasi nota
   * @param userId id utente
   * @param noteId id della nota da modificare
   * @param updatedContent contenuto modificato
   */
  async updateNote(userId: number, noteId: number, updatedContent: string) {
    if (!updatedContent || updatedContent.trim().length === 0)
      throw new HttpException(
        'Il contenuto della nota non può essere vuoto',
        HttpStatus.BAD_REQUEST,
      );

    if (updatedContent.length > 500)
      throw new HttpException(
        'Il contenuto della nota supera il limite di 500 caratteri',
        HttpStatus.BAD_REQUEST,
      );
    const user = await this.userService.checkUser(userId);

    const note = await this.noteRepository.findOne({
      where: {
        id: noteId,
      },
      relations: {
        vehicle: true,
        user: true,
      },
    });
    if (!note)
      throw new HttpException(
        `Nota con ID ${noteId} non trovata`,
        HttpStatus.NOT_FOUND,
      );

    if (user.role.name !== 'Admin') {
      const vehicles = (await this.associationService.getVehiclesByUserRole(
        user.id,
      )) as VehicleEntity[];
      if (
        !vehicles.find((v) => v.veId === note.vehicle.veId) ||
        note.user.id !== user.id
      )
        throw new HttpException(
          'Non hai il permesso per aggiornare la nota di questo veicolo',
          HttpStatus.FORBIDDEN,
        );
    }

    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Aggiorna la nota
      await queryRunner.manager
        .getRepository(NoteEntity)
        .update({ key: note.key }, { content: updatedContent });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        `Errore durante l'aggiornamento della nota`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina una nota dal database, un utente normale può eliminare soltanto una nota creata da lui,
   * un admin può eliminare una qualisasi nota
   * @param userId id utente loggato
   * @param noteId id della nota
   */
  async deleteNote(userId: number, noteId: number) {
    const user = await this.userService.checkUser(userId);
    const note = await this.noteRepository.findOne({
      where: {
        id: noteId,
      },
      relations: {
        vehicle: true,
        user: true,
      },
    });
    if (!note)
      throw new HttpException(
        `Nota con ID ${noteId} non trovata`,
        HttpStatus.NOT_FOUND,
      );

    if (user.role.name !== 'Admin') {
      const vehicles = (await this.associationService.getVehiclesByUserRole(
        user.id,
      )) as VehicleEntity[];
      if (
        !vehicles.find((v) => v.veId === note.vehicle.veId) ||
        note.user.id !== user.id
      )
        throw new HttpException(
          'Non hai il permesso per eliminare la nota di questo veicolo',
          HttpStatus.FORBIDDEN,
        );
    }
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(NoteEntity).remove(note);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        `Errore durante l'eliminazione della nota`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Formatta il ritorno
   */
  private toDTO(note: NoteEntity) {
    const noteDTO = new NoteDto();
    noteDTO.id = note.id;
    noteDTO.content = note.content;
    const vehicleDTO = new VehicleDTO();
    vehicleDTO.id = note.vehicle.id;
    vehicleDTO.veId = note.vehicle.veId;
    const userDTO = new UserDTO();
    if (note.user) {
      userDTO.id = note.user.id;
      userDTO.username = note.user.username;
    }

    return {
      ...noteDTO,
      vehicle: vehicleDTO,
      user: userDTO,
    };
  }
}

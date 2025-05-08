import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { VehicleEntity } from 'src/classes/entities/vehicle.entity';
import { WorksiteEntity } from 'src/classes/entities/worksite.entity';
import { WorksiteHistoryEntity } from 'src/classes/entities/worksite-history.entity';
import { DataSource, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';
import { WorksiteHistoryDTO } from 'src/classes/dtos/worksite-history.dto';
import { WorksiteDTO } from 'src/classes/dtos/worksite.dto';

@Injectable()
export class WorksiteHistoryService {
  constructor(
    @InjectRepository(WorksiteHistoryEntity, 'readOnlyConnection')
    private readonly worksiteHistoryRepository: Repository<WorksiteHistoryEntity>,
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(WorksiteEntity, 'readOnlyConnection')
    private readonly worksiteRepository: Repository<WorksiteEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly associationService: AssociationService,
  ) {}

  /**
   * Aggiorna lo spostamento di un mezzo da un cantiere ad un altro,
   * facendo anche update della vecchia assegnazione inserendo data di fine
   * @param vehicleVeId veid identificativo veicolo
   * @param worksiteId id nuovo cantiere
   * @param dateFrom data inizio spostamento
   * @param comment commento spostamento
   */
  async createWorksiteHistory(
    vehicleVeId: number,
    worksiteId: number,
    dateFrom: string,
    comment: string,
  ): Promise<WorksiteHistoryEntity> {
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        veId: vehicleVeId,
      },
      relations: {
        worksite: true,
      },
    });
    if (!vehicle)
      throw new HttpException('Veicolo non trovato', HttpStatus.NOT_FOUND);
    let worksite: WorksiteEntity | null;
    if (worksiteId === -1) {
      worksite = null;
    } else {
      worksite = await this.worksiteRepository.findOne({
        where: {
          id: worksiteId,
        },
      });
      if (!worksite)
        throw new HttpException('Cantiere non trovato', HttpStatus.NOT_FOUND);
    }
    const newDateFrom = new Date(dateFrom + 'Z');
    // Check if date is valid
    if (isNaN(newDateFrom.getTime()))
      throw new HttpException('Data non valida', HttpStatus.BAD_REQUEST);

    const isSameWorksite =
      (vehicle.worksite === null && worksite === null) ||
      vehicle.worksite?.key === worksite?.key;

    if (isSameWorksite)
      throw new HttpException(
        'Il Veicolo è già assegnato a questo cantiere',
        HttpStatus.CONFLICT,
      );
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // aggiorno il vecchio cantiere
      const worksiteHistory = await this.worksiteHistoryRepository.findOne({
        where: {
          vehicle: {
            id: vehicle.id,
          },
          isActive: true,
        },
      });
      if (worksiteHistory) {
        await queryRunner.manager.getRepository(WorksiteHistoryEntity).update(
          { key: worksiteHistory.key },
          {
            isActive: false,
            dateTo: new Date(),
          },
        );
      }
      // aggiorno il veicolo
      await queryRunner.manager.getRepository(VehicleEntity).update(
        {
          key: vehicle.key,
        },
        {
          worksite: worksite ?? null,
        },
      );

      // creo nuovo cantiere storico
      const newWorksiteHistory = queryRunner.manager
        .getRepository(WorksiteHistoryEntity)
        .create({
          dateFrom: newDateFrom,
          dateTo: null,
          comment: comment,
          vehicle: vehicle,
          worksite: worksite ?? null,
        });
      await queryRunner.manager
        .getRepository(WorksiteHistoryEntity)
        .save(newWorksiteHistory);
      await queryRunner.commitTransaction();

      // se ho aggiornato il worksite devo assegnare il mezzo a tutti gli utenti
      await this.associationService.setVehiclesAssociateAllUsersRedis();
      await this.associationService.setVehiclesAssociateAllUsersRedisSet();
      return newWorksiteHistory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante la creazione dello storico cantiere`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ritorna lo storico dei cantieri di un mezzo
   * @param userId user id
   * @param veId identificativo veicolo
   * @param admin se utente admin
   * @returns
   */
  async getWorksiteHistoryByVeId(
    userId: number,
    veId: number,
    admin: boolean,
  ): Promise<WorksiteHistoryDTO[] | null> {
    if (!admin)
      await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      const worksiteHistories = await this.worksiteHistoryRepository.find({
        where: {
          vehicle: {
            veId: veId,
          },
        },
        relations: {
          vehicle: true,
          worksite: true,
        },
      });
      return worksiteHistories.map((item) => this.toDTO(item));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero storico cantieri`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Formattazione della risposta
   * @param worksiteHistory oggetto dal db
   * @returns WorksiteHistoryDTO
   */
  private toDTO(worksiteHistory: WorksiteHistoryEntity): WorksiteHistoryDTO {
    const worksiteHistoryDTO = new WorksiteHistoryDTO();
    worksiteHistoryDTO.id = worksiteHistory.id;
    worksiteHistoryDTO.createdAt = worksiteHistory.createdAt;
    worksiteHistoryDTO.updatedAt = worksiteHistory.updatedAt;
    worksiteHistoryDTO.dateFrom = worksiteHistory.dateFrom;
    worksiteHistoryDTO.dateTo = worksiteHistory.dateTo;
    worksiteHistoryDTO.comment = worksiteHistory.comment;
    worksiteHistoryDTO.isActive = worksiteHistory.isActive;
    worksiteHistoryDTO.worksite = new WorksiteDTO();
    if (worksiteHistory.worksite) {
      worksiteHistoryDTO.worksite.id = worksiteHistory.worksite.id;
      worksiteHistoryDTO.worksite.name = worksiteHistory.worksite.name;
    } else {
      worksiteHistoryDTO.worksite = null;
    }
    return worksiteHistoryDTO;
  }
}

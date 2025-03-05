import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { In, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';

@Injectable()
export class WorksiteService {
  constructor(
    @InjectRepository(WorksiteEntity, 'readOnlyConnection')
    private readonly worksiteRepository: Repository<WorksiteEntity>,
    private readonly associationService: AssociationService,
  ) {}

  /**
   * Ritorna oggetto cantiere in base all id passato
   * @param id identificativo cantiere
   * @returns
   */
  async getWorksiteById(id: number): Promise<any> {
    const worksite = await this.worksiteRepository.findOne({
      where: {
        id: id,
      },
    });
    return worksite;
  }
  /**
   * Recupera i cantieri associati in base all'utente che li richiede
   * @param userId id utente
   * @returns
   */
  async getWorksitesByUser(userId: number): Promise<WorksiteEntity[]> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    try {
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const veIdArray = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];
      const worksites = await this.worksiteRepository.find({
        select: {
          id: true,
          name: true,
        },
        where: {
          vehicle: {
            veId: In(veIdArray),
          },
        },
        order: {
          name: 'ASC',
        },
      });
      return worksites;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle sessioni veId con range temporale`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

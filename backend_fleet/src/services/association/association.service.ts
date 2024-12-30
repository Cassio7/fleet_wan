import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssociationEntity } from 'classes/entities/association.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AssociationService {
  constructor(
    @InjectRepository(AssociationEntity, 'readOnlyConnection')
    private readonly associationRepository: Repository<AssociationEntity>,
  ) {}

  /**
   * Funzione che recupera i veicoli che un utente può visualizzare, in base al suo ruolo di assegnazione
   * @param id User id
   * @returns Veicoli
   */
  async getVehiclesByUserRole(id: number) {
    const associations = await this.associationRepository.find({
      where: {
        user: {
          id: id,
        },
      },
      relations: {
        worksite: {
          vehicle: true,
        },
        company: {
          group: {
            worksite_group: {
              worksite: {
                vehicle: true,
              },
            },
          },
        },
      },
      order: {
        company: {
          group: {
            id: 'ASC',
          },
        },
      },
    });
    const vehicles = new Set();
    associations.forEach((association) => {
      // Prendo i veicoli se hanno direttamente associazione con worksite
      if (association.worksite?.vehicle) {
        association.worksite.vehicle.forEach((vehicle) =>
          vehicles.add(vehicle),
        );
      }
      // Prendo tutti i veicoli passando da company -> group -> worksite_group -> worksite considerando soltanto il comune principale per evitare duplicati
      if (association.company?.group) {
        const firstGroup = association.company.group[0];
        if (firstGroup.worksite_group) {
          firstGroup.worksite_group.forEach((worksiteGroup) => {
            if (worksiteGroup.worksite?.vehicle) {
              worksiteGroup.worksite.vehicle.forEach((vehicle) =>
                vehicles.add(vehicle),
              );
            }
          });
        }
      }
    });
    return Array.from(vehicles);
  }
}

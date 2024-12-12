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
    });
    const vehicles = new Set();

    associations.forEach((association) => {
      // Vehicles directly associated with worksite
      if (association.worksite?.vehicle) {
        association.worksite.vehicle.forEach((vehicle) =>
          vehicles.add(vehicle),
        );
      }

      // Vehicles through company -> group -> worksite_group -> worksite
      if (association.company?.group) {
        association.company.group.forEach((group) => {
          if (group.worksite_group) {
            group.worksite_group.forEach((worksiteGroup) => {
              if (worksiteGroup.worksite?.vehicle) {
                worksiteGroup.worksite.vehicle.forEach((vehicle) =>
                  vehicles.add(vehicle),
                );
              }
            });
          }
        });
      }
    });
    return Array.from(vehicles);
  }
}

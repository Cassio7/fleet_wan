import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentDTO } from 'src/classes/dtos/equipment.dto';
import { EquipmentEntity } from 'src/classes/entities/equipment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(EquipmentEntity, 'readOnlyConnection')
    private readonly equipmentRepository: Repository<EquipmentEntity>,
  ) {}

  async getEquipments(): Promise<EquipmentDTO[]> {
    const equipments = await this.equipmentRepository.find();
    return equipments.map((equipment) => this.toDTO(equipment));
  }

  private toDTO(equipment: EquipmentDTO): EquipmentDTO {
    const equipmentDTO = new EquipmentDTO();
    equipmentDTO.id = equipment.id;
    equipmentDTO.createdAt = equipment.createdAt;
    equipmentDTO.updatedAt = equipment.updatedAt;
    equipmentDTO.name = equipment.name;
    return equipmentDTO;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentDTO } from 'classes/dtos/equipment.dto';
import { EquipmentEntity } from 'classes/entities/equipment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(EquipmentEntity, 'readOnlyConnection')
    private readonly equipmentRepository: Repository<EquipmentEntity>,
  ) {}

  async getEquipments() {
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

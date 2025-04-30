import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentEntity } from 'src/classes/entities/equipment.entity';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';
import { Repository } from 'typeorm';

@Injectable()
export class EquipmentFacotoryService {
  private readonly cvsPath = path.resolve(
    process.cwd(),
    'files/ATTREZZATURE.csv',
  );
  constructor(
    @InjectRepository(EquipmentEntity, 'readOnlyConnection')
    private equipmentRepository: Repository<EquipmentEntity>,
  ) {}

  async createDefaultEquipment(): Promise<EquipmentEntity[]> {
    const equipmentData = await parseCsvFile(this.cvsPath);
    const equipmentEntities = await Promise.all(
      equipmentData.map(async (data) => {
        const equipment = new EquipmentEntity();
        equipment.name = data.name;

        return equipment;
      }),
    );

    return this.equipmentRepository.save(equipmentEntities);
  }
}

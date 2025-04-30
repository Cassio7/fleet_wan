import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyEntity } from 'src/classes/entities/company.entity';
import { GroupEntity } from 'src/classes/entities/group.entity';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';
import { Repository } from 'typeorm';

@Injectable()
export class GroupFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/COMUNI.csv');

  constructor(
    @InjectRepository(GroupEntity, 'mainConnection')
    private groupRepository: Repository<GroupEntity>,
    @InjectRepository(CompanyEntity, 'mainConnection')
    private companyRepository: Repository<CompanyEntity>,
  ) {}

  async createDefaultGroup(): Promise<GroupEntity[]> {
    const groupData = await parseCsvFile(this.cvsPath);

    const groupEntities = await Promise.all(
      groupData.map(async (data) => {
        const group = new GroupEntity();
        group.vgId = data.vgId;
        group.name = data.name;
        group.company = await this.companyRepository.findOne({
          where: {
            id: data.companyId,
          },
        });
        return group;
      }),
    );

    return this.groupRepository.save(groupEntities);
  }
}

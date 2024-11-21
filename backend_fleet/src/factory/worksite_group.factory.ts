import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from 'classes/entities/group.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { WorksiteGroupEntity } from 'classes/entities/worksite_group.entity';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';
import { Repository } from 'typeorm';

@Injectable()
export class WorksiteGroupFactoryService {
  private readonly cvsPath = path.resolve(
    process.cwd(),
    'files/CANTIERI-COMUNI.csv',
  );

  constructor(
    @InjectRepository(WorksiteGroupEntity, 'mainConnection')
    private worksiteGroupRepository: Repository<WorksiteGroupEntity>,
    @InjectRepository(WorksiteEntity, 'mainConnection')
    private worksiteRepository: Repository<WorksiteEntity>,
    @InjectRepository(GroupEntity, 'mainConnection')
    private groupRepository: Repository<GroupEntity>,
  ) {}

  async createDefaultWorksiteGroup(): Promise<WorksiteGroupEntity[]> {
    const worksiteGroupData = await parseCsvFile(this.cvsPath);

    const worksiteGroupEntities = await Promise.all(
      worksiteGroupData.map(async (data) => {
        const worksiteGroup = new WorksiteGroupEntity();
        worksiteGroup.worksite = await this.worksiteRepository.findOne({
          where: {
            id: data.worksiteId,
          },
        });
        worksiteGroup.group = await this.groupRepository.findOne({
          where: {
            id: data.groupId,
          },
        });
        return worksiteGroup;
      }),
    );
    return this.worksiteGroupRepository.save(worksiteGroupEntities);
  }
}

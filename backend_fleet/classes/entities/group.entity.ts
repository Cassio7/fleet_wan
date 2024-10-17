import { CommonEntity } from 'classes/common/common.entity';
import { GroupInterface } from 'classes/interfaces/group.interface';
import { Column, Entity, Index } from 'typeorm';

@Entity('groups')
export class GroupEntity extends CommonEntity implements GroupInterface {
  @Column()
  @Index()
  vgId: number;

  @Column()
  name: string;
}

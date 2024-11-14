import { CommonEntity } from 'classes/common/common.entity';
import { CompanyInterface } from 'classes/interfaces/company.interface';
import { Column, Entity } from 'typeorm';

@Entity('companies')
export class CompanyEntity extends CommonEntity implements CompanyInterface {
  @Column()
  suId: number;
  
  @Column()
  name: string;
}

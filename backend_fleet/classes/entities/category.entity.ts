import { CommonEntity } from 'classes/common/common.entity';
import { CategoryInterface } from 'classes/interfaces/category.interface';
import { Column, Entity, ManyToOne } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity('categories')
export class CategoryEntity extends CommonEntity implements CategoryInterface {
  @Column()
  name: string;

  @Column()
  description: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.category)
  vehicle: VehicleEntity;
}

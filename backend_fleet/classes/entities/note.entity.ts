import { CommonEntity } from 'classes/entities/common.entity';
import { NoteInterface } from 'classes/interfaces/note.interface';
import { Column, Entity, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'notes',
  comment: `Nota di un veicolo associata ad un utente`,
})
export class NoteEntity extends CommonEntity implements NoteInterface {
  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.note)
  vehicle: VehicleEntity;

  @ManyToOne(() => UserEntity, (user) => user.note)
  user: UserEntity;
}

import * as bcrypt from 'bcrypt';
import { CommonEntity } from 'src/classes/entities/common.entity';
import { UserInterface } from 'src/classes/interfaces/user.interface';
import { BeforeInsert, Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AssociationEntity } from './association.entity';
import { NoteEntity } from './note.entity';
import { NotificationEntity } from './notification.entity';
import { RoleEntity } from './role.entity';

@Entity({
  name: 'users',
  comment: `Tabella utenti presenti nel sistema`,
})
export class UserEntity extends CommonEntity implements UserInterface {
  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  surname: string;

  @Column({ nullable: false, unique: true })
  username: string;

  @Column()
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  password: string;

  @Column({ type: 'boolean', nullable: true })
  active: boolean;
  // funzione per hashare password prima dell'inserimento nel db
  @BeforeInsert()
  async setPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(password || this.password, salt);
  }

  @OneToMany(() => AssociationEntity, (association) => association.user)
  association: AssociationEntity[];

  @OneToMany(() => NoteEntity, (note) => note.user)
  note: NoteEntity[];

  @ManyToOne(() => RoleEntity, (role) => role.user)
  role: RoleEntity;

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notification: NotificationEntity;
}

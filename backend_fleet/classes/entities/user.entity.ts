import { CommonEntity } from 'classes/common/common.entity';
import { UserInterface } from 'classes/interfaces/user.interface';
import { BeforeInsert, Column, Entity, OneToMany } from 'typeorm';
import { UserRoleEntity } from './user_role.entity';
@Entity('users')
export class UserEntity extends CommonEntity implements UserInterface {
  @Column({ nullable: true })
  username: string;

  @Column()
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  password: string;

  // funzione per hashare password prima dell'inserimento nel db
  @BeforeInsert()
  async setPassword(password: string) {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(password || this.password, salt);
  }

  @OneToMany(() => UserRoleEntity, (user_role) => user_role.user)
  user_role: UserRoleEntity[];
}

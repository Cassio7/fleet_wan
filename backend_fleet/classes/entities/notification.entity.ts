import { CommonEntity } from 'classes/entities/common.entity';
import { NotificationInterface } from 'classes/interfaces/notification.interface';
import { Column, Entity, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({
  name: 'notifications',
  comment: 'Salva le notifiche degli utente e segna se sono lette',
})
export class NotificationEntity
  extends CommonEntity
  implements NotificationInterface
{
  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean' })
  isRead: boolean;

  @ManyToOne(() => UserEntity, (user) => user.notification)
  user: UserEntity;
}

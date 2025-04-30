import { CommonEntity } from 'src/classes/entities/common.entity';
import { NotificationInterface } from 'src/classes/interfaces/notification.interface';
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
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean' })
  isRead: boolean;

  @Column({ type: 'text'  }) 
  author: string;

  @ManyToOne(() => UserEntity, (user) => user.notification)
  user: UserEntity;
}


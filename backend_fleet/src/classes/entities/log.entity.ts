import { LogInterface } from 'src/classes/interfaces/log.interface';
import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity({
  name: 'logs',
  comment: 'Log generati dall applicazione',
})
export class LogEntity extends CommonEntity implements LogInterface {
  @Column()
  level: string;
  @Column({ type: 'timestamptz' })
  timestamp: Date;
  @Column()
  server: string;
  @Column()
  resource: string;
  @Column()
  operation: string;
  @Column({ nullable: true })
  resourceId: number;
  @Column({ nullable: true })
  resourceKey: string;
  @Column()
  userId: number;
  @Column()
  username: string;
  @Column({ type: 'text', nullable: true })
  details: string;
  @Column({ nullable: true })
  errorMessage: string;
  @Column({ type: 'text', nullable: true })
  errorStack: string;
  @Column({ nullable: true })
  errorStatus: number;
}

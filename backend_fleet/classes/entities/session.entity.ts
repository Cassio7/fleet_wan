import { CommonEntity } from 'classes/entities/common.entity';
import { SessionInterface } from 'classes/interfaces/session.interface';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { HistoryEntity } from './history.entity';

@Entity({
  name: 'session',
  comment: `Sessione che indica accendimento e spegnimento veicolo`,
})
export class SessionEntity extends CommonEntity implements SessionInterface {
  @Column({ type: 'timestamptz', nullable: true })
  @Index()
  period_from: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @Index()
  period_to: Date;

  @Column()
  @Index()
  sequence_id: number;

  @Column({ type: 'boolean' })
  closed: boolean;

  @Column({ type: 'double precision' })
  @Index()
  distance: number;

  @Column()
  engine_drive: number;

  @Column()
  engine_stop: number;

  @OneToMany(() => HistoryEntity, (history) => history.session, {
    cascade: true,
  })
  history: HistoryEntity[];

  @Column({ type: 'varchar', length: 100 })
  @Index('IDX-session-hash')
  hash: string;
}

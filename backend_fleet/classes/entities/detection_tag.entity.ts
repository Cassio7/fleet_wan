import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TagEntity } from './tag.entity';
import { TagHistoryEntity } from './tag_history.entity';
import { DetectionTagInterface } from 'classes/interfaces/detection_tag.interface';

@Entity('detection_tag')
export class DetectionTagEntity implements DetectionTagInterface{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  tid: string;

  @Column('float')
  detection_quality: number;

  @ManyToOne(() => TagEntity)
  @JoinColumn({ name: 'epc' })
  @Index()
  epc: TagEntity;

  @ManyToOne(() => TagHistoryEntity)
  @JoinColumn({ name: 'tag_history_id' })
  @Index()
  tagHistory: TagHistoryEntity;
}

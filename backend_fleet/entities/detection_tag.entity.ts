import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tag } from './tag.entity';
import { TagHistory } from './tag_history.entity';

@Entity()
export class DetectionTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tid: string;

  @Column('float')
  detection_quality: number;

  @ManyToOne(() => Tag)
  @JoinColumn({ name: 'epc' })
  epc: Tag;

  @ManyToOne(() => TagHistory)
  @JoinColumn({ name: 'tag_history_id' })
  tagHistory: TagHistory;
}

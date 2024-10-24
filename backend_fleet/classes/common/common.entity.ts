import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CommonInterface } from './common.interface';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class CommonEntity implements CommonInterface {
  @PrimaryGeneratedColumn()
  @Index()
  id: number;

  @Column()
  key: string;

  @BeforeInsert()
  generateKey() {
    this.key = uuidv4();
  }

  @CreateDateColumn({ type: 'timestamptz'})
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz'})
  @Index()
  updatedAt: Date;

  @VersionColumn({ type: 'timestamptz'})
  @Index()
  version: number;
}
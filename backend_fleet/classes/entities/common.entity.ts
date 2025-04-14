import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CommonInterface } from '../interfaces/common.interface';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class CommonEntity implements CommonInterface {
  @PrimaryGeneratedColumn()
  @Index()
  id: number;

  @Column()
  @Index()
  key: string;

  @BeforeInsert()
  generateKey() {
    this.key = uuidv4();
  }

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @VersionColumn({ type: 'timestamptz' })
  version: number;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}

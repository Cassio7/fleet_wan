import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Group {
  @PrimaryColumn()
  vgId: number;

  @Column()
  name: string;
}

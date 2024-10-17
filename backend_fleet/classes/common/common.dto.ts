import { CommonInterface } from './common.interface';

export class CommonDto implements CommonInterface {
    
  id: number;
  key: string;

  createdAt: Date;
  updatedAt: Date;
  version: number;
}

import { CommonInterface } from './common.interface';

export interface LogInterface extends CommonInterface {
  level: string;
  timestamp: Date;
  server: string;
  resource: string;
  operation: string;
  resourceId: number | null;
  resourceKey: string | null;
  userId: number;
  username: string;
  details: string;
  errorMessage: string | null;
  errorStack: string | null;
  errorStatus: number | null;
}

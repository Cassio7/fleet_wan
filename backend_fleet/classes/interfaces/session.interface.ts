export interface SessionInterface {
  period_from?: Date | null;
  period_to?: Date | null;
  sequence_id: number;
  closed: boolean;
  distance: number;
  engine_drive: number;
  engine_stop: number;
  hash: string;
}

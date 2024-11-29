import { History } from "./History";
export class Session {
  constructor(
    public sequence_id: number,
    public closed: boolean,
    public distance: number,
    public engine_drive: number,
    public engine_stop: number,
    public history: History[],
    public hash: string,
    public anomalies: any[],
    public period_from: Date,
    public period_to: Date,
  ) {}
}

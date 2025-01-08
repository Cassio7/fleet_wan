export class Anomaly {
  constructor(
    public date: Date,
    public gps: string | null,
    public antenna: string | null,
    public session: string | null,
  ) {}
}

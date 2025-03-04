export class Anomaly {
  constructor(
    public date: Date,
    public gps: string | null,
    public antenna: string | null,
    public detection_quality: string | null,
    public session: string | null,
    public session_count: number | null
  ) {}
}

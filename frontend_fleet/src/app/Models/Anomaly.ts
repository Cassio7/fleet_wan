export class Anomaly {
  constructor(
    public date: Date,
    public gps: string | null,
    public gps_count: number,
    public antenna: string | null,
    public antenna_count: number,
    public detection_quality: string | null,
    public session: string | null,
    public session_count: number
  ) {}
}

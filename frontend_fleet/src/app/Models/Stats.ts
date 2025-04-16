export class Stats {
  constructor(
    public veId: number,
    public max_sessions: number, //numero di sessioni totali
    public num_sessions: number, //numero di sessioni registrate
    public num_anomaly: number, //numero di giornate controllate
    public gps: {
      ok: number; //numero di giornate con gps ok
      warning: number; //numero di giornate con gps warning
      error: number; //numero di giornate con gps error
      null: number; //sessione nulla
    },
    public antenna: {
      ok: number;
      nosession: number;
      notag: number;
      null: number;
    },
    public detection_quality: {
      excellent: number;
      good: number;
      poor: number;
    },
    public session: {
      ok: number;
      open: number;
      null: number;
    }
  ) {}
}

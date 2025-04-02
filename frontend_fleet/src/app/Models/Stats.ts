export class Stats {
  veId: number | null;
  num_sessions: number | null;
  num_anomaly: number | null;
  gps: {
    ok: number | null;
    warning: number | null;
    error: number | null;
    null: number | null;
  };
  antenna: {
    ok: number | null;
    nosession: number | null;
    notag: number | null;
    null: number | null;
  };
  detection_quality: {
    excellent: number | null;
    good: number | null;
    poor: number | null;
  };
  session: {
    ok: number | null;
    open: number | null;
    null: number | null;
  };

  constructor(data: Partial<Stats>) {
    this.veId = data.veId ?? null;
    this.num_sessions = data.num_sessions ?? null;
    this.num_anomaly = data.num_anomaly ?? null;
    this.gps = {
      ok: data.gps?.ok ?? null,
      warning: data.gps?.warning ?? null,
      error: data.gps?.error ?? null,
      null: data.gps?.null ?? null,
    };
    this.antenna = {
      ok: data.antenna?.ok ?? null,
      nosession: data.antenna?.nosession ?? null,
      notag: data.antenna?.notag ?? null,
      null: data.antenna?.null ?? null,
    };
    this.detection_quality = {
      excellent: data.detection_quality?.excellent ?? null,
      good: data.detection_quality?.good ?? null,
      poor: data.detection_quality?.poor ?? null,
    };
    this.session = {
      ok: data.session?.ok ?? null,
      open: data.session?.open ?? null,
      null: data.session?.null ?? null,
    };
  }
}

import { Anomaly } from "./Anomaly";
import { Realtime } from "./Realtime";
import { Vehicle } from "./Vehicle";

export class VehicleData {
  constructor(
    public vehicle: Vehicle,
    public anomalies: Anomaly[],
    public realtime: Realtime
  ) {}
}

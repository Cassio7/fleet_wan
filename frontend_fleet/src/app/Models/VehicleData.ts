import { Anomaly } from "./Anomaly";
import { Vehicle } from "./Vehicle";

export class VehicleData {
  constructor(
    public vehicle: Vehicle,
    public anomalies: Anomaly[]
  ) {}
}

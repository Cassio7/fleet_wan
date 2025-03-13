import { Anomaly } from "./Anomaly";
import { Service } from "./Service";
import { Vehicle } from "./Vehicle";
import { WorkSite } from "./Worksite";

export class VehicleAnomalies{
  constructor(
    public vehicle: Vehicle,
    public anomalies: Anomaly[]
  ){}
}

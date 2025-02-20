import { Anomaly } from "./Anomaly";
import { Service } from "./Service";
import { WorkSite } from "./Worksite";

export class VehicleAnomalies{
  constructor(
    public vehicle: {
      id: number;
      plate: string;
      veId: number;
      isRFIDReader: boolean;
      worksite: WorkSite;
      service: Service;
    },
    public anomalies: Anomaly[]
  ){}
}

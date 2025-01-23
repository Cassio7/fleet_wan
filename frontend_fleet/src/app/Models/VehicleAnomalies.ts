import { Anomaly } from "./Anomaly";

export class VehicleAnomalies{
  constructor(
    public vehicle: {
      id: number;
      plate: string;
      veId: number;
      isRFIDReader: boolean;
      worksiteId: number;
      worksiteName: string;
    },
    public anomalies: Anomaly[]
  ){}
}

import { Vehicle } from "./Vehicle";

export class VehicleData {
  constructor(
    public vehicle: Vehicle,
    public anomalies: {
      date: Date;
      gps: string | null;
      antenna: string | null;
      session: string | null;
    }[]
  ) {}
}

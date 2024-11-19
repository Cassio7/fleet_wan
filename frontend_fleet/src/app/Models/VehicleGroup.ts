import { Group } from "./Group";
import { Vehicle } from "./Vehicle";

export class VehicleGroup {
  constructor(
    public group: Group,
    public vehicle: Vehicle
  ) {}
}

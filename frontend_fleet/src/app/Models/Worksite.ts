import { Group } from "./Group";
import { Vehicle } from "./Vehicle";

export class WorkSite{
  constructor(
    public id: number,
    public name: string,
    public vehicleCount: number,
    public vehicle: Vehicle[],
    public group: Group
  ){}
}

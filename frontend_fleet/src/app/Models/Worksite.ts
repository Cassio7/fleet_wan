import { Group } from "./Group";

export class WorkSite{
  constructor(
    public id: number,
    public name: string,
    public vehicleCount: number,
    public group: Group
  ){}
}

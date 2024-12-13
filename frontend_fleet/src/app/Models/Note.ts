import { Vehicle } from "./Vehicle";

export class Note{
  constructor(
    public content: string,
    public vehicle: Vehicle,
    public userId: number
  ){}
}

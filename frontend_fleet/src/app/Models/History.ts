import { Session } from "./Session";
import { Vehicle } from "./Vehicle";

export class History {
  constructor(
    public timestamp: Date | null,
    public status: number,
    public latitude: number,
    public longitude: number,
    public nav_mode: number,
    public speed: number,
    public direction: number,
    public tot_distance: number,
    public tot_consumption: number,
    public fuel: number,
    public brushes: number,
    public vehicle: Vehicle,
    public session: Session,
    public hash: string
  ) {}
}

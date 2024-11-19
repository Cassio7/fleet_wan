import { Device } from "./Device";
import { RealtimePosition } from "./RealtimePosition";
import { Session } from "./Session";
import { TagHistory } from "./TagHistory";
import { VehicleGroup } from "./VehicleGroup";

export class Vehicle {
  constructor(
    public veId: number,
    public active: boolean,
    public plate: string,
    public model: string,
    public firstEvent: Date | null,
    public lastEvent: Date | null,
    public lastSessionEvent: Date | null,
    public isCan: boolean,
    public isRFIDReader: boolean,
    public profileId: number,
    public profileName: string,
    public hash: string,
    public device: Device | null,
    public realtime_position: RealtimePosition[],
    public history: History[],
    public taghistory: TagHistory[],
    public vehicle_group: VehicleGroup[],
    public sessions: Session[],
    public gpsError: boolean
  ) {}
}

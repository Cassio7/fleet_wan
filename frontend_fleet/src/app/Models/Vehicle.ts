import { Device } from "./Device";
import { Note } from "./Note";
import { RealtimePosition } from "./RealtimePosition";
import { Session } from "./Session";
import { TagHistory } from "./TagHistory";
import { VehicleGroup } from "./VehicleGroup";
import { WorkSite } from "./Worksite";

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
    public anomaliaSessione: string,
    public anomalySessions: any[],
    public lastValidSession: any,
    public gpsError: boolean,
    public worksite: { name: string } | null | undefined,
    public note?: Note
  ) {}
}

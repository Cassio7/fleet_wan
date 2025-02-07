import { Company } from "./Company";
import { Device } from "./Device";
import { Equipment } from "./Equipment";
import { Group } from "./Group";
import { Note } from "./Note";
import { Realtime } from "./Realtime";
import { Service } from "./Service";
import { WorkSite } from "./Worksite";
import { Workzone } from "./Workzone";

export class Vehicle {
  constructor(
    public id: number,
    public plate: string,
    public model: string,
    public veId: number,
    public isRFIDReader: boolean,
    public allestimento: boolean,
    public firstEvent: Date,
    public note: Note | null,
    public device: Device,
    public realtime: Realtime,
    public relevant_company?: string,
    public worksite?: WorkSite,
    public workzone?: Workzone,
    public group?: Group,
    public company?: Company,
    public service?: Service,
    public equipment?: Equipment
  ) {}
}


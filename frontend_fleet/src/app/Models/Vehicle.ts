import { Company } from "./Company";
import { Device } from "./Device";
import { Group } from "./Group";
import { Note } from "./Note";
import { WorkSite } from "./Worksite";

export class Vehicle {
  constructor(
    public id: number,
    public plate: string,
    public model: string,
    public veId: number,
    public isRFIDReader: boolean,
    public firstEvent: Date,
    public note: Note | null,
    public group: Group,
    public company: Company,
    public device: Device,
    public relevant_company?: string,
    public worksite?: WorkSite
  ) {}
}


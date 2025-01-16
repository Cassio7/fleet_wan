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
    public worksite?: WorkSite
  ) {}
}


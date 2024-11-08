import { DetectionTag } from "./DetectionTag";
import { Vehicle } from "./Vehicle";

export class TagHistory {
  constructor(
    public timestamp: Date,
    public latitude: number,
    public longitude: number,
    public nav_mode: number,
    public geozone: string,
    public vehicle: Vehicle,
    public detectiontag: DetectionTag[]
  ) {}
}

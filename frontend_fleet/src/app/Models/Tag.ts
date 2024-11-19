import { DetectionTag } from "./DetectionTag";

export class Tag {
  constructor(
    public epc: string,
    public detectiontag: DetectionTag[]
  ) {}
}

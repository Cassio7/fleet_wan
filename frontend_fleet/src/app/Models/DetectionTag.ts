import { Tag } from "./Tag";
import { TagHistory } from "./TagHistory";

export class DetectionTag {
  constructor(
    public tid: string,
    public detection_quality: number,
    public tag: Tag,
    public tagHistory: TagHistory
  ) {}
}

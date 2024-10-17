import { DetectionTagInterface } from "./detection_tag.interface";

export interface TagInterface{
    epc: string;
    detectiontag: DetectionTagInterface[];
}
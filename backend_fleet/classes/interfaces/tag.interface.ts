import { CommonInterface } from "classes/interfaces/common.interface";
import { DetectionTagInterface } from "./detection_tag.interface";

export interface TagInterface extends CommonInterface{
    epc: string;
    detectiontag: DetectionTagInterface[];
}
import { TagInterface } from "./tag.interface";
import { TagHistoryInterface } from "./tag_history.interface";

export interface DetectionTagInterface{
    tid: string;
    detection_quality: number;
    tag: TagInterface;
    tagHistory: TagHistoryInterface;
}
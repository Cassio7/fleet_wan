import { TagInterface } from "./tag.interface";
import { TagHistoryInterface } from "./tag_history.interface";

export interface DetectionTagInterface{
    id: number;
    tid: string;
    detection_quality: number;
    epc: TagInterface;
    tagHistory: TagHistoryInterface;
}
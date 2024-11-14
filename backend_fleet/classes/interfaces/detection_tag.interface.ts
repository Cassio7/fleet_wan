import { CommonInterface } from "classes/common/common.interface";
import { TagInterface } from "./tag.interface";
import { TagHistoryInterface } from "./tag_history.interface";

export interface DetectionTagInterface extends CommonInterface{
    tid: string;
    detection_quality: number;
    tag: TagInterface;
    tagHistory: TagHistoryInterface;
}
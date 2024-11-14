import { CommonInterface } from "classes/common/common.interface";
import { DetectionTagInterface } from "./detection_tag.interface";
import { VehicleInterface } from "./vehicle.interface";

export interface TagHistoryInterface extends CommonInterface{
    timestamp: Date;
    latitude: number;
    longitude: number;
    nav_mode: number;
    geozone: string;
    vehicle: VehicleInterface;
    detectiontag: DetectionTagInterface[];
}
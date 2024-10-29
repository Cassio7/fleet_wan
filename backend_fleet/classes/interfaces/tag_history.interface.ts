import { DetectionTagInterface } from "./detection_tag.interface";
import { VehicleInterface } from "./vehicle.interface";

export interface TagHistoryInterface{
    timestamp: Date;
    latitude: number;
    longitude: number;
    nav_mode: number;
    geozone: string;
    vehicle: VehicleInterface;
    detectiontag: DetectionTagInterface[];
}
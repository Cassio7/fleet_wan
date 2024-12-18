import { CommonInterface } from "classes/common/common.interface";
import { VehicleInterface } from "./vehicle.interface";

export interface RealtimePositionInterface extends CommonInterface{
    row_number: number;
    timestamp?: Date | null;
    status: number;
    latitude: number;
    longitude: number;
    nav_mode: number;
    speed: number;
    direction: number;
    vehicle: VehicleInterface;
    hash: string;
}
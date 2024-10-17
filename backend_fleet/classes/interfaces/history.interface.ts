import { VehicleInterface } from "./vehicle.interface";

export interface HistoryInterface{
    id: number;
    timestamp?: Date | null;
    status: number;
    latitude: number;
    longitude: number;
    nav_mode: number;
    speed: number;
    direction: number;
    tot_distance: number;
    tot_consumption: number;
    fuel: number;
    brushes: number;
    vehicle: VehicleInterface;
    hash: string;
}
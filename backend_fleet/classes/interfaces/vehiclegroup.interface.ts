import { GroupInterface } from "./group.interface";
import { VehicleInterface } from "./vehicle.interface";

export interface VehicleGroupInterface {
  vgId: number;
  veId: number;
  group: GroupInterface;
  vehicle: VehicleInterface;
}

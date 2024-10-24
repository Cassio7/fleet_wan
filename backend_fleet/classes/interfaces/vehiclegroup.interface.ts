import { CommonInterface } from "classes/common/common.interface";
import { GroupInterface } from "./group.interface";
import { VehicleInterface } from "./vehicle.interface";

export interface VehicleGroupInterface extends CommonInterface{
  group: GroupInterface;
  vehicle: VehicleInterface;
}

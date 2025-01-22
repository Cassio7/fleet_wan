import { VehicleData } from './VehicleData';

export class RealtimePosition {
  constructor(
    public row_number: number,
    public timestamp: Date | null = null,
    public status: number,
    public latitude: number,
    public longitude: number,
    public nav_mode: number,
    public speed: number,
    public direction: number,
    public vehicle: VehicleData,
    public hash: string
  ) {}
}

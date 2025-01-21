export class Realtime {
  constructor(
    public timestamp: string,
    public row_number: number,
    public status: number,
    public latitude: number,
    public longitude: number,
    public nav_mode: number,
    public speed: number,
    public direction: number
  ) {}
}

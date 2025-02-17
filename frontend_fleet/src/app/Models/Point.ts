export class Point{

  constructor(
    private _lat: number,
    private _long: number
  ) {}

  public get long(): number {
    return this._long;
  }
  public set long(value: number) {
    this._long = value;
  }
  public get lat(): number {
    return this._lat;
  }
  public set lat(value: number) {
    this._lat = value;
  }
}

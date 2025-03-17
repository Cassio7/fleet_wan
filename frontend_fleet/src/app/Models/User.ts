export class User {
  constructor(
    public id: number,
    public name: string,
    public surname: string,
    public username: string,
    public email: string,
    public role: string,
    public active: boolean,
    private _password: string
  ) {}

  public get password(): string {
    return this._password;
  }
  public set password(value: string) {
    this._password = value;
  }
}

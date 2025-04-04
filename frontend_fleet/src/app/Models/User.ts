export class User {
  public id!: number;
  public active!: boolean

  constructor(
    public name: string,
    public surname: string,
    public username: string,
    public email: string,
    public role: string,
    private _password: string,
    public idR?: number,
  ) {}

  public get password(): string {
    return this._password;
  }
  public set password(value: string) {
    this._password = value;
  }
}

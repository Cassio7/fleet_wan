import { Company } from "./Company";

export class Group {
  constructor(
    public id: number,
    public vgId: number,
    public name: string,
    public company?: Company
  ) {}
}

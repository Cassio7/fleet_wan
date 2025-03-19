import { Company } from "./Company";

export class Group {
  constructor(
    public vgId: number,
    public name: string,
    public company: Company
  ) {}
}

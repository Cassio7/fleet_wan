import { Company } from "./Company";
import { WorkSite } from "./Worksite";

export class Association {
  constructor(
    public id: number,
    public user: {
      id: number;
      username: string;
      role: string;
    },
    public company?: Company,
    public worksite?: WorkSite
  ) {}
}

import { WorkSite } from "./Worksite";

export class WorksiteHistory {
  constructor(
    public dateFrom: Date,
    public dateTo: Date | null = null,
    public comment: string | null = null,
    public isActive: boolean = true,
    public worksite: WorkSite,
    public vehicleId: number
  ) {}
}

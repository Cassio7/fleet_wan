import { Anomaly } from './Anomaly';
import { Realtime } from './Realtime';
import { Service } from './Service';
import { WorkSite } from './Worksite';

export class RealtimeData {
  constructor(
    public vehicle: {
      plate: string;
      worksite: WorkSite | null;
      veId: number;
      service?: Service | null;
    },
    public realtime: Realtime,
    public anomaly?: Anomaly
  ) {}
}

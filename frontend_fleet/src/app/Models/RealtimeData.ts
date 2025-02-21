import { Anomaly } from './Anomaly';
import { Realtime } from './Realtime';
import { WorkSite } from './Worksite';

export class RealtimeData {
  constructor(
    public vehicle: {
      plate: string;
      worksite: WorkSite | null;
      veId: number;
    },
    public realtime: Realtime,
    public anomaly?: Anomaly
  ) {}
}

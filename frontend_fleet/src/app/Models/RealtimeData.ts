import { Realtime } from "./Realtime"

export class RealtimeData{
  constructor(
    public vehicle: {
      plate: string,
      veId: string
    },
    public realtime: Realtime
  ){}
}

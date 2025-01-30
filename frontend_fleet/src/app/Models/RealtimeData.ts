import { Realtime } from "./Realtime"

export class RealtimeData{
  constructor(
    public vehicle: {
      plate: string,
      veId: number
    },
    public realtime: Realtime
  ){}
}

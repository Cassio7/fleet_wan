/**
 * Interfaccia per i dati relativi al tempo di lavoro mezzo
 */
export interface DriveStopTime {
  date: Date;
  distance: number; // indicata in km
  time: number; // indicata in ms
  start: number; // indicata in ms
  stop: number; // indicata in ms
}

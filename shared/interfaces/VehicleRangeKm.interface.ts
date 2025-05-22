/**
 * Interfaccia per i dati nella ricerca di un veicolo in base alle coordinate,
 * con dati riguardanti le sessioni e le posizioni
 */
export interface VehicleRangeKm {
  veId: number;
  plate: string;
  closest: {
    lat: number;
    long: number;
    timestamp: Date;
  };
  session: {
    sequence_id: number;
    history: {
      lat: number;
      long: number;
      timestamp: Date;
    }[];
  }[];
}

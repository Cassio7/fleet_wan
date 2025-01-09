import { Injectable } from '@angular/core';
import { Vehicle } from '../../Models/Vehicle';
import { VehicleData } from '../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class FirstEventsFilterService {

  constructor() { }

  /**
   * Filtra i first event duplicati
   * @param vehicles veicoli dai quali prendere i first event
   * @returns array di veicoli filtrati
   */
  filterFirstEventsDuplicates(vehicles: (Vehicle | VehicleData)[]): any[] {
    const seenFirstEvents = new Set<string>();

    return vehicles.filter(vehicle => {
      // Ottieni il firstEvent a seconda del tipo di oggetto (VehicleData o Vehicle)
      let firstEvent;
      if ('firstEvent' in vehicle) {
        firstEvent = vehicle.firstEvent;
      } else if ('vehicle' in vehicle && vehicle.vehicle.firstEvent) {
        firstEvent = vehicle.vehicle.firstEvent;
      }

      // Se non esiste firstEvent, escludi il veicolo
      if (!firstEvent) {
        return false;
      }

      // Verifica se firstEvent è una data o una stringa
      const date = firstEvent instanceof Date
        ? firstEvent
        : new Date(firstEvent);

      // Se la data è invalida, escludi il veicolo
      if (isNaN(date.getTime())) {
        return false;
      }

      const dateString = date.toISOString().split('T')[0]; // Estrae la data nel formato 'YYYY-MM-DD'

      // Se la data è già stata vista, esclude il veicolo
      if (seenFirstEvents.has(dateString)) {
        return false;
      }

      seenFirstEvents.add(dateString); // Aggiunge la data al Set
      return true; // Mantiene il veicolo
    });
  }
}

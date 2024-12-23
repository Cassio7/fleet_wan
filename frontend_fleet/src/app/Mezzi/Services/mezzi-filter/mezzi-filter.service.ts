import { Injectable } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class MezziFilterService {
  constructor() { }

  /**
   * Filtra i first event duplicati
   * @param vehicles veicoli dai quali prendere i first event
   * @returns array di veicoli filtrati
   */
  filterFirstEventsDuplicates(vehicles: Vehicle[]) {
    const seenFirstEvents = new Set<string>();
    return vehicles.filter(vehicle => {
      if (vehicle.firstEvent) {
        let date: Date;

        if (vehicle.firstEvent instanceof Date) {
          date = vehicle.firstEvent;
        } else {
          date = new Date(vehicle.firstEvent);
        }

        if (isNaN(date.getTime())) {
          return false;
        }

        const dateString = date.toISOString().split('T')[0];
        if (seenFirstEvents.has(dateString)) {
          return false;
        }
        seenFirstEvents.add(dateString);
        return true;
      } else {
        return false;
      }
    });
  }



}

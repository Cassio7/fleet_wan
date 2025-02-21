import { Injectable } from '@angular/core';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class MapFilterService {

  constructor(
    private plateFilterService: PlateFilterService,
    private cantieriFilterService: CantieriFilterService
  ) { }

  /**
   * Filtra dei veicoli in base ai filtri della mappa
   * @param vehicles veicoli da filtrare
   * @param plates targhe selezionate nel filtro per targhe
   * @param cantieri cantieri selezionati nel filtro per cantieri
   * @returns array di veicoli filtrati per cantieri e targhe
   */
  filterVehiclesByPlatesAndCantieri(vehicles: any, plates: string[], cantieri: string[]){
    // Applicazione filtri
    const plateFilteredVehicles = plates?.length
      ? this.plateFilterService.filterVehiclesByPlates(plates, vehicles) as Vehicle[]
      : [];

    const cantieriFilteredVehicles = cantieri?.length
      ? this.cantieriFilterService.filterVehiclesByCantieri(vehicles, cantieri) as Vehicle[]
      : [];

    // Unione dei due array filtrati
    const unionVehicles = vehicles.filter((vehicle: any) => {
      const matchesPlate = plates?.length
        ? plateFilteredVehicles.some(v => v.veId === vehicle.veId)
        : false;
      const matchesCantiere = cantieri?.length
        ? cantieriFilteredVehicles.some(v => v.veId === vehicle.veId)
        : false;
      return matchesPlate || matchesCantiere;
    });

    return unionVehicles;
  }
}

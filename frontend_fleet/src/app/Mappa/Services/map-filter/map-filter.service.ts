import { Injectable } from '@angular/core';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { Vehicle } from '../../../Models/Vehicle';
import { VehicleData } from '../../../Models/VehicleData';

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
  filterVehiclesByPlatesAndCantieri(
    vehicles: (Vehicle | VehicleData)[],
    plates: string[],
    cantieri: string[]
  ) {
    if ((!cantieri || cantieri.length === 0) && (!plates || plates.length === 0)) {
      return [];
    }

    if (!vehicles || vehicles.length === 0) {
      return [];
    }

    const cantieriFilteredVehicles = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, cantieri);

    if (cantieriFilteredVehicles.length === 0) {
      return [];
    }

    if ('vehicle' in cantieriFilteredVehicles[0]) {
      return this.plateFilterService.filterVehiclesByPlates(plates, cantieriFilteredVehicles as VehicleData[]);
    } else {
      return this.plateFilterService.filterVehiclesByPlates(plates, cantieriFilteredVehicles as Vehicle[]);
    }
  }

}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SortService {

  sortVehiclesByPlateAsc(vehicles: any[]): any[] {
    return [...vehicles].sort((a, b) => {
      if (!a.vehicle || !b.vehicle) return 0;
      return a.vehicle.plate.localeCompare(b.vehicle.plate) ?? 0;
    });
  }

  sortVehiclesByPlateDesc(vehicles: any[]): any[] {
    return [...vehicles].sort((a, b) => {
      if (!a.vehicle || !b.vehicle) return 0;
      return b.vehicle.plate.localeCompare(a.vehicle.plate) ?? 0;
    });
  }

  sortByCantiereAsc(vehicles: any[]): any[] {
    return [...vehicles].sort((a, b) => {
      if (!a.worksite?.name || !b.worksite?.name) return 0;
      return a.worksite.name.localeCompare(b.worksite.name) ?? 0;
    });
  }


  sortByCantiereDesc(vehicles: any[]): any[] {
    return [...vehicles].sort((a, b) => {
      if (!a.worksite?.name || !b.worksite?.name) return 0;
      return b.worksite.name.localeCompare(a.worksite.name) ?? 0;
    });
  }


}



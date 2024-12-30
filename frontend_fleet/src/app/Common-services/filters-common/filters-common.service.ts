import { Vehicle } from '../../Models/Vehicle';
import { Injectable } from '@angular/core';
import { PlateFilterService } from '../plate-filter/plate-filter.service';
import { CantieriFilterService } from '../cantieri-filter/cantieri-filter.service';
import { CheckErrorsService } from '../../Dashboard/Services/check-errors/check-errors.service';

export interface activeFilters{
  plate: string,
  cantieri: string[],
  gps: string[],
  antenna: string[],
  sessione: string[]
};
@Injectable({
  providedIn: 'root'
})
export class FiltersCommonService {

  constructor(
    private plateFilterService: PlateFilterService,
    private cantieriFilterService: CantieriFilterService,
    private checkErrorsService: CheckErrorsService
  ) { }

  private activeFilters: activeFilters = {
    plate: "",
    cantieri: [],
    gps: [],
    antenna: [],
    sessione: []
  }

  applyAllFiltersOnVehicles(vehicles: Vehicle[], activeFilters: activeFilters){

  }
}

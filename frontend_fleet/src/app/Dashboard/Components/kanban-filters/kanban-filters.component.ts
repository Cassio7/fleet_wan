import { KanbanGpsService } from './../../Services/kanban-gps/kanban-gps.service';
import { GpsGraphService } from './../../Services/gps-graph/gps-graph.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { Vehicle } from '../../../Models/Vehicle';
import { AntennaGraphService } from '../../Services/antenna-graph/antenna-graph.service';

@Component({
  selector: 'app-kanban-filters',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './kanban-filters.component.html',
  styleUrl: './kanban-filters.component.css'
})
export class KanbanFiltersComponent implements AfterViewInit{
  plate: string = "";
  filterForm!: FormGroup;
  cantieri = new FormControl<string[]>([]);

  //tracciatori di kanban
  private kanbanGps: boolean = false;
  private kanbanAntenna: boolean = false;

  constructor(
    private plateFilterService: PlateFilterService,
    public cantieriFilterService: CantieriFilterService,
    private kanbanGpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
    private gpsGraphService: GpsGraphService,
    private antennaGraphService: AntennaGraphService,
    private sortService: SortService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){
    this.filterForm = new FormGroup({
      cantiere: new FormControl(''),
      targa: new FormControl(''),
      range: new FormGroup({
        start: new FormControl(new Date()),
        end: new FormControl(new Date())
      })
    });
  }


  ngAfterViewInit(): void {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    setTimeout(() => {
      this.cantieriFilterService.allSelected = false;
      this.cantieriFilterService.updateListaCantieri(allVehicles);
      this.toggleSelectAllCantieri();

      const section =  this.sessionStorageService.getItem("dashboard-section");
      if(section == "GPS"){
        this.kanbanGps = true;
        this.kanbanAntenna = false;
      }else if(section == "Antenna"){
        this.kanbanGps = false;
        this.kanbanAntenna = true;
      }
    });

    this.cd.detectChanges();
  }

  /**
   * Invia il subject per filtrare le targhe in base all'input inserito
   * @param emptyButtonClick se la funzione è stata chiamata dalla premuta del bottone per svuotare il campo
   */
  searchPlates(emptyButtonClick: boolean){
    if(emptyButtonClick){
      this.plateFilterService.filterByPlateResearch$.next("");
      this.plate = "";
    }else{
      this.plateFilterService.filterByPlateResearch$.next(this.plate);
    }
  }

  /**
   * Gestisce la selezione di un cantiere nel menù apposito
   * @param option opzione selezionata
   */
  selectCantiere(option: string) {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    let selectedCantieri = this.cantieri.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAllCantieri();
    } else {
      if (this.cantieriFilterService.allSelected) {
        this.cantieriFilterService.allSelected = false;
        selectedCantieri = selectedCantieri.filter(selection => selection !== "Seleziona tutto");
        this.cantieri.setValue(selectedCantieri);
      }

      if (this.cantieriFilterService.allSelected && !selectedCantieri.includes("Seleziona tutto")) {
        //deselect seleziona tutto se viene deselezionata un'opzione
        selectedCantieri.unshift("Seleziona tutto");
        this.cantieri.setValue(selectedCantieri);

        this.cantieriFilterService.allSelected = false;
      }
    }

    let selectedCantieriCache: string[] = [];
    const cantieriFilteredVehicles: Vehicle[] = this.cantieriFilterService.filterVehiclesByCantieri(allVehicles, selectedCantieri);
    selectedCantieriCache = selectedCantieri;
    if(this.kanbanGps){
      this.gpsGraphService.loadChartData$.next(cantieriFilteredVehicles);
    }else if(this.kanbanAntenna){
      this.antennaGraphService.loadChartData$.next(cantieriFilteredVehicles);
    }

    this.kanbanGpsService.setKanbanData(cantieriFilteredVehicles);

    this.cd.detectChanges();
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAllCantieri() {
    this.cantieri.setValue(this.cantieriFilterService.toggleSelectAllCantieri());
  }
}

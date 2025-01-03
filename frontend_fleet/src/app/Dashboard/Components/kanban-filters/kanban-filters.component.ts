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
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';

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

  constructor(
    private plateFilterService: PlateFilterService,
    public cantieriFilterService: CantieriFilterService,
    private kanbanGpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
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
      this.cantieriFilterService.updateListaCantieri(allVehicles);
      this.toggleSelectAllCantieri();
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
    if(option=="Seleziona tutto"){
      this.toggleSelectAllCantieri();
    }else{
      const selectedCantieri = this.cantieri.value; //opzioni selezionate

      if(this.cantieriFilterService.isCantieriAllSelected()) {
        this.cantieriFilterService.allSelected = false;
      }
      //se sono stati selezionati cantieri, invio dati
      if (selectedCantieri) {
        this.kanbanGpsService.loadKanbanGps$.next();
        this.kanbanAntennaService.loadKanbanAntenna$.next();
      }
      this.cd.detectChanges();
    }
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAllCantieri() {
    this.cantieri.setValue(this.cantieriFilterService.toggleSelectAllCantieri());
  }
}

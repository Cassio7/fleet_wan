import { SessionStorageService } from './../../../Common-services/sessionStorage/session-storage.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';

@Component({
  selector: 'app-kebab-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonToggleModule,
    MatIconModule
  ],
  templateUrl: './kebab-menu.component.html',
  styleUrl: './kebab-menu.component.css'
})
export class KebabMenuComponent implements AfterViewInit{
  selectedOption: string = "table";

  constructor(
    private kanbanTableService: KanbanTableService,
    private kanbangpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
    private cd: ChangeDetectorRef,
    private sessionStorageService: SessionStorageService
  ){}

  ngAfterViewInit(): void {
    this.selectedOption = this.sessionStorageService.getItem("dashboard-section");
    this.cd.detectChanges();
  }

  /**
   * Gestisce il comportamento alla selezione di un'opzione nel kebab menu,
   * caricando la sezione corrispondente
   * @param value valore selezionato
   */
  chooseKebabMenuOption(value: string){
    switch(value){
      case "table":
        this.kanbanTableService.loadKabanTable$.next();//switcha a componente tabella
        this.sessionStorageService.setItem("dashboard-section", "table");
        break;
      case "GPS":
        this.kanbangpsService.loadKanbanGps$.next();//switcha a componente GPS
        this.sessionStorageService.setItem("dashboard-section", "GPS");
        break;
      case "antenna":
        this.kanbanAntennaService.loadKanbanAntenna$.next();//switcha a componente antenna
        this.sessionStorageService.setItem("dashboard-section", "Antenna");
        break;
    }
  }
}

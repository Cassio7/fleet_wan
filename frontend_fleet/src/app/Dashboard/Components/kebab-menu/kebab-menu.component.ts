import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class KebabMenuComponent{
  selectedOption: string = "table";

  constructor(
    private kanbanTableService: KanbanTableService,
    private kanbangpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService
  ){}

  chooseKebabMenuOption(value: string){
    switch(value){
      case "table":
        this.kanbanTableService.loadKabanTable$.next();//switcha a componente tabella
        break;
      case "GPS":
        this.kanbangpsService.loadKanbanGps$.next();//switcha a componente GPS
        break;
      case "antenna":
        this.kanbanAntennaService.loadKanbanAntenna$.next();//switcha a componente antenna
        break;
    }
  }
}

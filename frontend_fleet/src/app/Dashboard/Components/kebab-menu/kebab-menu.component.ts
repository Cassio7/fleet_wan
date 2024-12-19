import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';

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

  constructor(private kanbangpsService: KanbanGpsService){}

  chooseKebabMenuOption(value: string){
    switch(value){
      case "table":
        this.kanbangpsService.loadKanbanGps$.next("table");//switcha a componente tabella
        break;
      case "GPS":
        this.kanbangpsService.loadKanbanGps$.next("GPS");//switcha a componente GPS
        break;
      case "antenna":
        this.kanbangpsService.loadKanbanGps$.next("antenna");//switcha a componente antenna
        break;
    }
  }
}

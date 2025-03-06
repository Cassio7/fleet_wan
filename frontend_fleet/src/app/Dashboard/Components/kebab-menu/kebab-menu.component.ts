import { SessionStorageService } from './../../../Common-services/sessionStorage/session-storage.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { KanbanSessioneService } from '../../Services/kanban-sessione/kanban-sessione.service';
import { LoginService } from '../../../Common-services/login service/login.service';

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
  private readonly destroy$: Subject<void> = new Subject<void>();
  selectedOption: string = "table";

  constructor(
    private kanbanTableService: KanbanTableService,
    private kanbangpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
    private cd: ChangeDetectorRef,
    private loginService: LoginService,
    private sessionStorageService: SessionStorageService,
    private kanbanSessioneService: KanbanSessioneService
  ){}

  ngAfterViewInit(): void {
    this.selectedOption = this.sessionStorageService.getItem("dashboard-section");
    this.chooseKebabMenuOption(this.selectedOption);

    this.loginService.login$.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.chooseKebabMenuOption('table');
    });
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
      case "sessione":
        this.kanbanSessioneService.loadKanbanSessione$.next();
        this.sessionStorageService.setItem("dashboard-section", "sessione");
    }
  }
}

import { AfterViewInit, Component, effect, Input, input, ViewChild } from '@angular/core';
import { WorkSite } from '../../Models/Worksite';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SortService } from '../../Common-services/sort/sort.service';
import { GestioneService, GestioneFilters } from '../../Gestione-utenti/Services/gestione/gestione.service';
import { User } from '../../Models/User';
import { GestioneCantieriService } from '../Services/gestione-cantieri/gestione-cantieri.service';

@Component({
  selector: 'app-cantieri-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './cantieri-table.component.html',
  styleUrl: './cantieri-table.component.css'
})
export class CantieriTableComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('utentiTable', {static: false}) cantieriTable!: MatTable<WorkSite>;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns: string[] = ['Id', 'Cantiere', 'Comune', 'Societa', 'Veicoli associati', 'Azioni'];
  cantieriTableData = new MatTableDataSource<WorkSite>();
  @Input() cantieri!: WorkSite[];

  constructor(
    private gestioneCantieriService: GestioneCantieriService,
    private sortService: SortService,
    private router: Router
  ){
    effect(() => {
      const selectedCantieri = this.gestioneCantieriService.cantieriFilter() as string[];
      this.cantieriTableData.data = this.cantieri.filter((cantiere: WorkSite) => selectedCantieri.includes(cantiere.name));
    });
  }


  ngAfterViewInit(): void {
    this.cantieriTableData.data = this.cantieri;
    this.cantieriTable.renderRows();
  }

  /**
   * @param canteri canteri da ordinare
   * @returns Richiama la funzione nel servizio per ordinare i canteri
   */
  sortCantieriByMatSort(canteri: WorkSite[]): WorkSite[]{
    return canteri;
    // return this.sortService.sortUsersByMatSort(users, this.sort);
  }

  editCantiere(cantiere: WorkSite){

  }

  disabilitateCantiere(cantiere: WorkSite){

  }

  deleteCantiere(cantiere: WorkSite){

  }
}

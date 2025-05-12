import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { WorksiteHistoryService } from '../../Common-services/worksite-history/worksite-history.service';
import { WorksiteHistory } from '../../Models/Worksite-history';

@Component({
  selector: 'app-storico-cantieri',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule
  ],
  templateUrl: './storico-cantieri.component.html',
  styleUrl: './storico-cantieri.component.css'
})
export class StoricoCantieriComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('storicoCantieriTable') storicoCantieriTable!: MatTable<WorksiteHistory>;
  storicoCantieriTaleData = new MatTableDataSource<WorksiteHistory>();
  displayedColumns: string[] = ['Cantiere', 'Ingresso', 'Uscita', 'Commento'];

  @Input() veId!: number;
  @Input() newWorksiteHistory!: WorksiteHistory;

  constructor(
    private worksiteHistoryService: WorksiteHistoryService
  ){}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['newWorksiteHistory'] && this.newWorksiteHistory){
      //assegnazione di fine permanenza nell'ultimo cantiere
      const lastElement = this.storicoCantieriTaleData.data.at(-1);
      if (lastElement)
        lastElement.dateTo = new Date();

      //aggiunta
      this.storicoCantieriTaleData.data = [...this.storicoCantieriTaleData.data, this.newWorksiteHistory];
    }
  }

  async ngAfterViewInit(): Promise<void> {
    const worksiteHistories = await this.getWorksiteHistoryByVeId();
    this.storicoCantieriTaleData.data = worksiteHistories;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async getWorksiteHistoryByVeId(): Promise<WorksiteHistory[]>{
    try{
      return firstValueFrom(this.worksiteHistoryService.getWorksiteHistoryByVeIdAdmin(this.veId).pipe(takeUntil(this.destroy$)));
    }catch(error){
      console.error("Errore nella ricezione delle worksite history: ", error);
    }
    return [];
  }
}

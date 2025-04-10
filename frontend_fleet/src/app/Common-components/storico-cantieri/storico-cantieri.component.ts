import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { WorksiteHistory } from '../../Models/Worksite-history';
import { MatIconModule } from '@angular/material/icon';
import { WorksiteHistoryService } from '../../Common-services/worksite-history/worksite-history.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

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
export class StoricoCantieriComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('storicoCantieriTable') storicoCantieriTable!: MatTable<WorksiteHistory>;
  storicoCantieriTaleData = new MatTableDataSource<WorksiteHistory>();
  displayedColumns: string[] = ['Cantiere', 'Ingresso', 'Uscita'];

  @Input() veId!: number;

  constructor(
    private worksiteHistoryService: WorksiteHistoryService
  ){}

  async ngAfterViewInit(): Promise<void> {
    const worksiteHistories = await this.getWorksiteHistoryByVeId();
    console.log('worksiteHistories fetched: ', worksiteHistories);
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

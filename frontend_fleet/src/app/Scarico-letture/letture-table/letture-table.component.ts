import { AfterViewInit, Component, effect, inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { WorkSite } from '../../Models/Worksite';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Tag } from '../../Models/Tag';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { LettureFilters, LettureFilterService } from '../Services/letture-filter/letture-filter.service';
import { TagDownloadData, TagService } from '../../Common-services/tag/tag.service';
import { tagDownloadResponse } from '../home-letture/home-letture.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-letture-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule
  ],
  templateUrl: './letture-table.component.html',
  styleUrl: './letture-table.component.css'
})
export class LettureTableComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  @ViewChild('utentiTable', {static: false}) tagTable!: MatTable<TagDownloadData>;
  @ViewChild(MatSort) sort!: MatSort;
  snackBar= inject(MatSnackBar);
  displayedColumns: string[] = ['EPC', 'Type', 'Timestamp', 'Latitude', 'Longitude', 'Plate', 'Cantiere'];
  tagTableData = new MatTableDataSource<TagDownloadData>();

  constructor(
    private lettureFilterService: LettureFilterService,
    private tagService: TagService
  ){
    effect(() => {

    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

ngAfterViewInit(): void {
  this.lettureFilterService.filterByLettureFilters$
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: async (lettureFilters: LettureFilters | null) => {
        if (lettureFilters) {
          const { worksite, dateFrom, dateTo } = lettureFilters; // Extract filter values
          this.tagService.downloadTagRanged(15, dateFrom, dateTo).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (downloadData: tagDownloadResponse) => {
              console.log('downloadData: ', downloadData);
              this.tagTableData.data = downloadData.tags;
            },
            error: error => console.error("Errore nel recupero dei tag da scaricare: ", error)
          });
        }
      },
      error: (error) => console.error("Errore nel filtraggio delle letture: ", error),
    });
}



}

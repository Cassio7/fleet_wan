import { AfterViewInit, Component, effect, EventEmitter, inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';
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
  tagCount!: number;

  @Output() setTagDownloadData = new EventEmitter<TagDownloadData[]>();

  constructor(
    private lettureFilterService: LettureFilterService,
    private tagService: TagService
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
  this.lettureFilterService.filterByLettureFilters$
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (lettureFilters: LettureFilters | null) => {
        if (lettureFilters) {
          const { worksite, dateFrom, dateTo } = lettureFilters; // Extract filter values
          this.tagService.downloadTagRanged(15, dateFrom, dateTo).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (downloadData: tagDownloadResponse) => {
              this.tagCount = downloadData.count;
              this.tagTableData.data = downloadData.tags;
              this.setTagDownloadData.emit(downloadData.tags);
            },
            error: error => console.error("Errore nel recupero dei tag da scaricare: ", error)
          });
        }
      },
      error: (error) => console.error("Errore nel filtraggio delle letture: ", error),
    });
  }

}

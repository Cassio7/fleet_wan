import { TagDownloadData, TagService } from './../../Common-services/tag/tag.service';
import { AfterViewInit, Component, effect, EventEmitter, inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { WorkSite } from '../../Models/Worksite';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Tag } from '../../Models/Tag';
import { firstValueFrom, skip, Subject, takeUntil } from 'rxjs';
import { LettureFilters, LettureFilterService } from '../Services/letture-filter/letture-filter.service';
import { CommonModule } from '@angular/common';
import { tagDownloadResponse } from '../home-letture/home-letture.component';

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
  displayedColumns: string[] = ['EPC', 'Timestamp', 'Latitude', 'Longitude', 'Plate', 'Cantiere'];
  tagTableData = new MatTableDataSource<TagDownloadData>();
  lettureFilters!: LettureFilters;
  tagCount!: number;

  @Output() setTagDownloadData = new EventEmitter<TagDownloadData[]>();
  @Input() cantieri: WorkSite[] = [];

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
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (lettureFilters: LettureFilters | null) => {
          if (lettureFilters) {
          this.lettureFilters = lettureFilters;
          const { cantieriNames, dateFrom, dateTo } = lettureFilters;
          const worksitesIds: number[] = this.cantieri
          .filter(cantiere => cantieriNames.includes(cantiere.name))
          .map(cantiere => cantiere.id);
          this.tagService.getDownloadTagsRangedPreview(worksitesIds, dateFrom, dateTo).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (downloadData: tagDownloadResponse) => {
              this.tagCount = downloadData.count;
              this.tagTableData.data = downloadData.tags;
              this.setTagDownloadData.emit(this.tagTableData.data);
            },
            error: error => console.error("Errore nel recupero dei tag da scaricare: ", error)
          });
        }
      },
      error: (error) => console.error("Errore nel filtraggio delle letture: ", error),
    });
  }

}

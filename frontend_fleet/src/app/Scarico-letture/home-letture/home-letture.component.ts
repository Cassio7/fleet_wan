import { TagDownloadData, TagService } from './../../Common-services/tag/tag.service';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LettureTableComponent } from "../letture-table/letture-table.component";
import { GestioneCantieriService } from '../../Gestione-cantieri/Services/gestione-cantieri/gestione-cantieri.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { WorkSite } from '../../Models/Worksite';
import { LettureFiltersComponent } from "../letture-filters/letture-filters.component";
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { LettureFilters, LettureFilterService } from '../Services/letture-filter/letture-filter.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

export interface tagDownloadResponse{
  count: number,
  tags: TagDownloadData[]
}
@Component({
  selector: 'app-home-letture',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LettureTableComponent,
    LettureFiltersComponent
  ],
  templateUrl: './home-letture.component.html',
  styleUrl: './home-letture.component.css'
})
export class HomeLettureComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  cantieri: WorkSite[] = [];
  @Input() tagDownloadData: TagDownloadData[] = [];

  downloading: boolean = false;
  private lettureFilters!: LettureFilters | null;

  constructor(
    private gestioneCantieriService: GestioneCantieriService,
    private lettureFilterService: LettureFilterService,
    private tagService: TagService,
    private cd: ChangeDetectorRef
  ){}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ngOnInit(): void {
    this.gestioneCantieriService.getAllWorksite().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (worksites: WorkSite[]) => {
        this.cantieri = worksites;
        this.cd.detectChanges();
        console.log('home letture cantieri: ', worksites);
      },
      error: error => console.error("Errore nell'ottenere tutti i cantieri: ", error)
    });

    this.lettureFilterService.filterByLettureFilters$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (lettureFilters: LettureFilters | null) => {
        this.lettureFilters = lettureFilters;
      },
      error: error => console.error("Errore nel recapito dei filtri delle letture in home letture: ", error)
    });
  }

  exportToExcel() {
    this.downloading = true;
    if(this.lettureFilters){
      const { dateFrom, dateTo, cantieriNames } = this.lettureFilters;
      const worksitesIds: number[] = this.cantieri
      .filter(cantiere => cantieriNames.includes(cantiere.name))
      .map(cantiere => cantiere.id);

      this.tagService.downloadTagsRanged(worksitesIds, dateFrom, dateTo)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (blob: Blob) => {
          if(this.lettureFilters){
            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            link.href = url;

            link.download = `tags-${dateFrom}-${dateTo}.xlsx`;

            link.click();

            this.downloading = false;

            window.URL.revokeObjectURL(url);
          }
        },
        error: (error) => {
          console.error("Errore nel download dei tag: ", error);
        }
      });
    }
  }

  setDownloadData(tagDownloadData: TagDownloadData[]){
    this.tagDownloadData = tagDownloadData;
  }
}

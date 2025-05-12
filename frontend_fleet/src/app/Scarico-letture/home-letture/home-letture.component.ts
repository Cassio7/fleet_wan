import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { skip, Subject, takeUntil } from 'rxjs';
import { GestioneCantieriService } from '../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { WorkSite } from '../../Models/Worksite';
import { LettureFiltersComponent } from "../letture-filters/letture-filters.component";
import { LettureTableComponent } from "../letture-table/letture-table.component";
import { LettureFilters, LettureFilterService } from '../Services/letture-filter/letture-filter.service';
import { TagDownloadData, TagService } from './../../Common-services/tag/tag.service';

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
    this.gestioneCantieriService.getAllWorksiteMe().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (worksites: WorkSite[]) => {
        this.cantieri = worksites;
        this.cd.detectChanges();
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
      let worksitesIds: number[] = this.cantieri
      .filter(cantiere => cantieriNames.includes(cantiere.name))
      .map(cantiere => cantiere.id);
      // se recupero tutti i cantieri passo oggetto vuoto
      if (worksitesIds.length === this.cantieri.length) {
        worksitesIds = [];
      };
      this.tagService.downloadTagsRanged(worksitesIds, dateFrom.toString(), dateTo.toString())
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (blob: Blob) => {
          if(this.lettureFilters){
            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            const parsedDateFrom = new Date(dateFrom).toLocaleDateString('it-IT').replace(/\//g, '-');
            const parsedDateTo = new Date(dateTo).toLocaleDateString('it-IT').replace(/\//g, '-');

            link.download = `tags-${parsedDateFrom}-${parsedDateTo}.xlsx`;

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

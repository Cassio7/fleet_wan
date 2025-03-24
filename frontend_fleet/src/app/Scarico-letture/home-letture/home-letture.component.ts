import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { LettureTableComponent } from "../letture-table/letture-table.component";
import { GestioneCantieriService } from '../../Gestione-cantieri/Services/gestione-cantieri/gestione-cantieri.service';
import { Subject, takeUntil } from 'rxjs';
import { WorkSite } from '../../Models/Worksite';
import { LettureFiltersComponent } from "../letture-filters/letture-filters.component";
import { TagDownloadData } from '../../Common-services/tag/tag.service';

export interface tagDownloadResponse{
  count: number,
  tags: TagDownloadData[]
}
@Component({
  selector: 'app-home-letture',
  standalone: true,
  imports: [LettureTableComponent, LettureFiltersComponent],
  templateUrl: './home-letture.component.html',
  styleUrl: './home-letture.component.css'
})
export class HomeLettureComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  cantieri: WorkSite[] = [];

  constructor(
    private gestioneCantieriService: GestioneCantieriService,
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
  }

}

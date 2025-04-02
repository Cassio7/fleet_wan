import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AssociationsKanbanComponent } from "../associations-kanban/associations-kanban.component";
import { DatiCantiereComponent } from "../dati-cantiere/dati-cantiere.component";
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WorkSite } from '../../../Models/Worksite';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { Group } from '../../../Models/Group';
import { Vehicle } from '../../../Models/Vehicle';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { CantiereEditFiltersComponent } from "../cantiere-edit-filters/cantiere-edit-filters.component";

@Component({
  selector: 'app-home-cantiere-edit',
  standalone: true,
  imports: [CommonModule, AssociationsKanbanComponent, DatiCantiereComponent, CantiereEditFiltersComponent],
  templateUrl: './home-cantiere-edit.component.html',
  styleUrl: './home-cantiere-edit.component.css'
})
export class HomeCantiereEditComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  cantiere!: WorkSite;
  plateResearch: string = "";
  freeVehicles: Vehicle[] = [];
  groups: Group[] = [];

  constructor(
    private gestioneCantieriService: GestioneCantieriService,
    private vehiclesApiService: VehiclesApiService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ){}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (params) => {
        const worksiteId = params["id"];

        this.gestioneCantieriService.getWorksiteById(worksiteId).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (worksite: WorkSite) => {
            this.cantiere = worksite;
            this.cd.detectChanges();
            console.log('fetched worksite: ', this.cantiere);
            console.log('worksite vehicles: ', this.cantiere.vehicle);
          },
          error: error => console.error(`Errore nell'ottenere il cantiere tramite l'id: ${error}`)
        });
      },
      error: error => console.error("Errore nella ricezione dei parametri dall'url: ", error)
    });

    this.gestioneCantieriService
      .getAllGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups: Group[]) => {
          this.groups = groups;
          console.log('groups fetched from home getsione: ', groups);
          this.cd.detectChanges();
        },
        error: (error) =>
          console.error("Errore nell'ottenere tutti i cantieri: ", error),
      });

    this.vehiclesApiService.getAllFreeVehiclesAdmin().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        this.freeVehicles = vehicles;
        console.log('freeVehicles fetched: ', this.freeVehicles);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'ottenere tutti i veicoli liberi: ", error)
    });
  }
}

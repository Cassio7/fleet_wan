import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { Vehicle } from '../../../Models/Vehicle';
import { WorkSite } from '../../../Models/Worksite';
import { openSnackbar } from '../../../Utils/snackbar';
import { MoveCantiereDialogComponent } from '../move-cantiere-dialog/move-cantiere-dialog.component';

@Component({
  selector: 'app-associations-kanban',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    MatSnackBarModule,
    MatIconModule],
  templateUrl: './associations-kanban.component.html',
  styleUrl: './associations-kanban.component.css'
})
export class AssociationsKanbanComponent implements AfterViewInit, OnDestroy, OnChanges{
  private readonly destroy$: Subject<void> = new Subject<void>();

  readonly dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  @Input() worksite!: WorkSite;
  @Input() freeVehicles: Vehicle[] = [];
  @Input() plateResearch: string = "";

  //dati delle liste
  worksiteList: Vehicle[] = [];
  freeList: Vehicle[] = [];

  constructor(
    private gestioneCantieriService: GestioneCantieriService,
    private plateFilterService: PlateFilterService,
    private cd: ChangeDetectorRef
  ){}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['plateResearch']){
      const plateFilteredWorksiteVehicles = this.plateFilterService.filterVehiclesByPlateResearch(this.plateResearch, this.worksite.vehicle) as Vehicle[];
      const plateFilteredFreeVehicles = this.plateFilterService.filterVehiclesByPlateResearch(this.plateResearch, this.freeVehicles) as Vehicle[];
      this.freeList = plateFilteredFreeVehicles;
      this.worksiteList = plateFilteredWorksiteVehicles;
      this.cd.detectChanges();
    }
  }

  trackVehicle(index: number, vehicle: Vehicle): any {
    return vehicle.veId;  // Use the unique vehicle ID to track each item
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.worksite.vehicle.forEach(vehicle => {
      if (!this.worksiteList.some(existingVehicle => existingVehicle.veId === vehicle.veId)) {
        this.worksiteList.push(vehicle);
      }
    });

    // commentato per evitare duplicati kanban
    // this.freeVehicles.forEach(vehicle => {
    //   this.freeList.push(vehicle)
    // });
  }

  drop(event: CdkDragDrop<Vehicle[]>) {
    const draggedVehicle = event.previousContainer.data[event.previousIndex];
    const sourceListId = event.previousContainer.id;
    const destinationListId = event.container.id;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const dialogRef = this.dialog.open(MoveCantiereDialogComponent);

      dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: { dateFrom: string, comment: string }) => {
          if(result){
            if (sourceListId === 'cdk-drop-list-0' && destinationListId === 'cdk-drop-list-1') {
              this.gestioneCantieriService.freeVehicle(draggedVehicle.veId, result.dateFrom, result.comment).pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response: {message: string}) => {
                  transferArrayItem(
                    event.previousContainer.data,
                    event.container.data,
                    event.previousIndex,
                    event.currentIndex,
                  );
                  openSnackbar(this.snackbar, "Veicolo liberato!")
                },
                error: error => {
                  console.error("Errore nello spostamento del veicolo: ", error)
                  openSnackbar(this.snackbar, "Errore nello spostamento del veicolo, spostamento annullato.");
                }
              });
            } else if (sourceListId === 'cdk-drop-list-1' && destinationListId === 'cdk-drop-list-0') {
              this.gestioneCantieriService.moveVehicleInWorksite(draggedVehicle.veId, this.worksite.id, result.dateFrom, result.comment).pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response: {message: string}) => {
                  transferArrayItem(
                    event.previousContainer.data,
                    event.container.data,
                    event.previousIndex,
                    event.currentIndex,
                  );
                  openSnackbar(this.snackbar, "Veicolo spostato nel cantiere!")
                },
                error: error => {
                  console.error("Errore nello spostamento del veicolo: ", error)
                  openSnackbar(this.snackbar, "Errore nello spostamento del veicolo, spostamento annullato.");
                }
              });
            }
          }else{
            openSnackbar(this.snackbar, "Spostamento del veicolo annullato.");
          }
          console.log('worksite.vehicle: ', this.worksite.vehicle);
          console.log('this.freeVehicles: ', this.freeVehicles);
        },
        error: error => console.error("Errore nella chiusura del dialog per lo spostamento del veicolo: ", error)
      });
    }
  }

  trackByVehicle(index: number, vehicle: any): any {
    return vehicle.veId; // Assuming veId is a unique identifier for each vehicle
  }
}

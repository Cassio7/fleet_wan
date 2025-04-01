import { AfterViewInit, Component, inject, Input, OnDestroy } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Vehicle } from '../../../Models/Vehicle';
import { WorkSite } from '../../../Models/Worksite';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MoveCantiereDialogComponent } from '../move-cantiere-dialog/move-cantiere-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';

@Component({
  selector: 'app-associations-kanban',
  standalone: true,
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    MatSnackBarModule,
    MatIconModule],
  templateUrl: './associations-kanban.component.html',
  styleUrl: './associations-kanban.component.css'
})
export class AssociationsKanbanComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  readonly dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  @Input() worksite!: WorkSite;
  @Input() worksiteVehicles: Vehicle[] = [];
  @Input() freeVehicles: Vehicle[] = [];

  worksiteList: Vehicle[] = [];

  freeList: Vehicle[] = [];

  constructor(
    private gestioneCantieriService: GestioneCantieriService
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    console.log('worksiteVehicles: ', this.worksiteVehicles);
    console.log('this.freeVehicles: ', this.freeVehicles);
    this.worksiteVehicles.forEach(vehicle => {
      this.worksiteList.push(vehicle)
    });
    this.freeVehicles.forEach(vehicle => {
      this.freeList.push(vehicle)
    });
  }

  drop(event: CdkDragDrop<Vehicle[]>) {
    const draggedVehicle = event.previousContainer.data[event.previousIndex];
    const sourceListId = event.previousContainer.id;
    const destinationListId = event.container.id;

    console.log('sourceListId: ', sourceListId);
    console.log('destinationListId: ', destinationListId);

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
                  this.openSnackbar("Veicolo liberato!")
                },
                error: error => {
                  console.error("Errore nello spostamento del veicolo: ", error)
                  this.openSnackbar("Errore nello spostamento del veicolo, spostamento annullato.");
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
                  this.openSnackbar("Veicolo spostato nel cantiere!")
                },
                error: error => {
                  console.error("Errore nello spostamento del veicolo: ", error)
                  this.openSnackbar("Errore nello spostamento del veicolo, spostamento annullato.");
                }
              });
            }
          }else{
            this.openSnackbar("Spostamento del veicolo annullato.");
          }
          console.log('worksiteVehicles: ', this.worksiteVehicles);
          console.log('this.freeVehicles: ', this.freeVehicles);
        },
        error: error => console.error("Errore nella chiusura del dialog per lo spostamento del veicolo: ", error)
      });
    }
  }

  /**
   * Apre la snackbar con il contenuto passato
   * @param content stringa contenuto della snackbar
   */
  openSnackbar(content: string): void {
    this.snackbar.openFromComponent(SnackbarComponent, {
      duration: 2 * 1000,
      data: { content: content }
    });
  }
}

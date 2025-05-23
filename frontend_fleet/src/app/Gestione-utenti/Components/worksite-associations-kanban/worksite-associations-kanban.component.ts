import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { Association } from '../../../Models/Association';
import { WorkSite } from '../../../Models/Worksite';
import { openSnackbar } from '../../../Utils/snackbar';
import { AssociationsService, getAssociationsResponse } from '../../Services/associations/associations.service';

@Component({
  selector: 'app-worksite-associations-kanban',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    MatSnackBarModule,
    MatDividerModule,
    MatIconModule
  ],
  templateUrl: './worksite-associations-kanban.component.html',
  styleUrl: './worksite-associations-kanban.component.css'
})
export class WorksiteAssociationsKanbanComponent implements AfterViewInit, OnChanges, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  @Input() userId!: number;
  @Input() associationResponse!: getAssociationsResponse;
  @Input() worksiteResearch: string = "";

  snackbar: MatSnackBar = inject(MatSnackBar);

  associationsList: Association[] = [];
  associationsFreeWorksites: WorkSite[] = [];

  constructor(private associationsService: AssociationsService,
    private cd: ChangeDetectorRef
  ){}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if(changes['worksiteResearch']){
    //   this.associationsList = this.associations;
    // }
  }

  ngAfterViewInit(): void {
    this.associationsList = this.associationResponse.associations;
    if(this.associationResponse.worksiteFree) this.associationsFreeWorksites = this.associationResponse.worksiteFree;
  }

  /**
   * Gestisce il drop di un elemento su una delle due colonne, per poi riconoscere la sorgente e la destinazione dello spostamento
   * per chiamare la funzione dedicata
   * @param event evento drag and drop
   */
  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer.id === 'worksites-list' && event.container.id === 'associations-list') {
      this.handleWorksiteToAssociation(event);
    } else if (event.previousContainer.id === 'associations-list' && event.container.id === 'worksites-list') {
      this.handleAssociationToWorksite(event);
    } else if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  /**
   * Permette di gestire lo spostamento di una società nella lista della associazioni, e creando un associazione nel database tramite un chiamata API
   * @param event evento drag and drop
   */
  handleWorksiteToAssociation(event: CdkDragDrop<any[]>) {
    const draggedWorksite = event.previousContainer.data[event.previousIndex] as WorkSite;

    this.associationsService.createAssociation(this.userId, [draggedWorksite.id]).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: {message: string, association: Association[]}) => {
          //rimuove il cantiere spostato dalla lista dei cantieri
          this.associationsFreeWorksites = this.associationsFreeWorksites.filter(worksite => worksite.id !== draggedWorksite.id);
          //aggiunta dell'associazione creata alla lista di associazioni
          this.associationsList.push(response.association[0]);
          this.cd.detectChanges();

          openSnackbar(this.snackbar, `Cantiere associato con l'utente!`);
        },
        error: error => {
          console.error("Errore nella creazione della nuova associazione: ", error);
          openSnackbar(this.snackbar, `Errore nell'associazione del cantiere con l'utente.`);
        }
      });
  }

  /**
   * Permette di gestire lo spostamento di una associazione nella lista delle società, ed eliminando l'associazione dal database tramite una chiamata API
   * @param event evento drag and drop
   */
  handleAssociationToWorksite(event: CdkDragDrop<any[]>) {
    const draggedAssociation = event.previousContainer.data[event.previousIndex] as Association;
    const worksite = draggedAssociation.worksite;

    if (!worksite) {
      console.error("Association without worksite data");
      return;
    }

    this.associationsList = this.associationsList.filter(a => a.id !== draggedAssociation.id);
    this.associationsFreeWorksites.push(worksite);

    this.associationsService.deleteAssociationById(draggedAssociation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          openSnackbar(this.snackbar, "Associazione con l'utente eliminata!");
        },
        error: error => {
          console.error("Errore nella eliminazione dell'associazione: ", error);
          openSnackbar(this.snackbar, `Errore nell'eliminazione dell'associazione`);

          // 🔁 Revert the optimistic update
          this.associationsFreeWorksites = this.associationsFreeWorksites.filter(w => w.id !== worksite.id);
          this.associationsList.push(draggedAssociation);
          this.cd.detectChanges(); // Trigger manual change detection
        }
      });
  }


  trackByAssociaton(index: number, association: any): any {
    return association.id; // Assuming veId is a unique identifier for each vehicle
  }

  trackByWorksite(index: number, worksite: WorkSite): number{
    return worksite.id;
  }

}

import { CdkDropListGroup, CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AssociationsService, getAssociationsResponse } from '../../Services/associations/associations.service';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';
import { Association } from '../../../Models/Association';
import { Company } from '../../../Models/Company';

@Component({
  selector: 'app-company-associations-kanban',
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
  templateUrl: './company-associations-kanban.component.html',
  styleUrl: './company-associations-kanban.component.css'
})
export class CompanyAssociationsKanbanComponent implements AfterViewInit, OnChanges, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  @Input() userId!: number;
  @Input() associationResponse!: getAssociationsResponse;
  @Input() companyResearch: string = "";

  snackbar: MatSnackBar = inject(MatSnackBar);

  associationsList: Association[] = [];
  associationsFreeCompanies: Company[] = [];

  constructor(private associationsService: AssociationsService,
    private cd: ChangeDetectorRef
  ){}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if(changes['companyResearch']){
    //   this.associationsList = this.associations;
    // }
  }

  ngAfterViewInit(): void {
    this.associationsList = this.associationResponse.associations;
    if(this.associationResponse.companyFree) this.associationsFreeCompanies = this.associationResponse.companyFree;
  }

  /**
   * Gestisce il drop di un elemento su una delle due colonne, per poi riconoscere la sorgente e la destinazione dello spostamento
   * per chiamare la funzione dedicata
   * @param event evento drag and drop
   */
  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer.id === 'companies-list' && event.container.id === 'associations-list') {
      this.handleCompanyToAssociation(event);
    } else if (event.previousContainer.id === 'associations-list' && event.container.id === 'companies-list') {
      this.handleAssociationToCompany(event);
    } else if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  /**
   * Permette di gestire lo spostamento di una società nella lista della associazioni, e creando un associazione nel database tramite un chiamata API
   * @param event evento drag and drop
   */
  handleCompanyToAssociation(event: CdkDragDrop<any[]>) {
    const draggedCompany = event.previousContainer.data[event.previousIndex] as Company;
    console.log('company: ', draggedCompany);

    this.associationsService.createAssociation(this.userId, undefined, [draggedCompany.id]).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: {message: string, association: Association[]}) => {
          console.log('created association: ', response.association[0]);
          //rimuove il cantiere spostato dalla lista dei cantieri
          this.associationsFreeCompanies = this.associationsFreeCompanies.filter(company => company.id !== draggedCompany.id);
          //aggiunta dell'associazione creata alla lista di associazioni
          this.associationsList.push(response.association[0]);
          this.cd.detectChanges();

          this.openSnackbar(`Società associata con l'utente!`);
        },
        error: error => {
          console.error("Errore nella creazione della nuova associazione: ", error);
          this.openSnackbar(`Errore nell'associazione del cantiere con l'utente.`);
        }
      });
  }

  /**
   * Permette di gestire lo spostamento di una associazione nella lista delle società, ed eliminando l'associazione dal database tramite una chiamata API
   * @param event evento drag and drop
   */
  handleAssociationToCompany(event: CdkDragDrop<any[]>) {
    const draggedAssociation = event.previousContainer.data[event.previousIndex] as Association;
    const company = draggedAssociation.company;

    if (!company) {
      console.error("Association without company data");
      return;
    }

    this.associationsList = this.associationsList.filter(a => a.id !== draggedAssociation.id);
    this.associationsFreeCompanies.push(company);

    this.associationsService.deleteAssociationById(draggedAssociation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.openSnackbar("Associazione con l'utente eliminata!");
        },
        error: error => {
          console.error("Errore nella eliminazione dell'associazione: ", error);
          this.openSnackbar(`Errore nell'eliminazione dell'associazione`);

          // Revert the optimistic update
          this.associationsFreeCompanies = this.associationsFreeCompanies.filter(w => w.id !== company.id);
          this.associationsList.push(draggedAssociation);
          this.cd.detectChanges();
        }
      });
  }


  trackByAssociaton(index: number, association: any): any {
    return association.id; // Assuming veId is a unique identifier for each vehicle
  }

  trackByCompany(index: number, company: Company): number{
    return company.id;
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

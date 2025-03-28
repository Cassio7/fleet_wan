import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Company } from '../../../Models/Company';
import { SocietaTableComponent } from '../societa-table/societa-table.component';
import { SocietaFiltersComponent } from '../societa-filters/societa-filters.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonService } from '../../../Common-services/common service/common.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { Group } from '../../../Models/Group';
import { GestioneSocietaService } from '../../Services/gestione-societa/gestione-societa.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home-gestione-societa',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    SocietaTableComponent,
    SocietaFiltersComponent,
    MatIconModule,
  ],
  templateUrl: './home-gestione-societa.component.html',
  styleUrl: './home-gestione-societa.component.css',
})
export class HomeGestioneSocietaComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  societa: Company[] = [];
  groups: Group[] = [];
  snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);

  constructor(
    private gestioneSocietaService: GestioneSocietaService,
    private commonService: CommonService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.gestioneSocietaService
      .getAllSocieta()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies: Company[]) => {
          this.societa = companies;
          console.log('societa fetched from home getsione: ', companies);
          this.cd.detectChanges();
        },
        error: (error) =>
          console.error("Errore nell'ottenere tutti i societa: ", error),
      });

    // this.gestioneSocietaService.getAllGroups().pipe(takeUntil(this.destroy$))
    // .subscribe({
    //   next: (groups: Group[]) => {
    //     this.groups = groups;
    //     console.log('groups fetched from home getsione: ', groups);
    //     this.cd.detectChanges();
    //   },
    //   error: error => console.error("Errore nell'ottenere tutti i societa: ", error)
    // });
  }

  // createNewCantiere(): void {
  //   const dialogRef = this.dialog.open(SocietaCreateDialogComponent, {
  //     data: {
  //       groups: this.groups,
  //       societa: this.societa
  //     }
  //   });

  //   dialogRef.afterClosed().subscribe((result: {name: string, comune: string}) => {
  //     if (result !== undefined) {
  //       console.log('result: ', result);
  //       if(result.comune){
  //         this.gestioneSocietaService.getGroupIdByName(result.comune).pipe(takeUntil(this.destroy$))
  //         .subscribe({
  //           next: (gruopId: number | null) => {
  //             if(gruopId){
  //               this.createCantiere({name: result.name, groupId: gruopId})
  //             }
  //           },
  //           error: error => console.error("Errore nella ricerca dell'id del comune tramite il nome: ", error)
  //         });
  //       }else{
  //         this.createCantiere({name: result.name})
  //       }
  //     }
  //   });
  // }

  // private createCantiere(newSocietaData: {name: string, groupId?: number}){
  //   console.log('cantiere da creare in hmoe: ', newSocietaData);
  //   this.gestioneSocietaService.createCantiere(newSocietaData).pipe(takeUntil(this.destroy$))
  //   .subscribe({
  //     next: (createdSocietaData: {message: string, societa: Societa}) => {
  //       console.log('createdSocietaData: ', createdSocietaData);
  //       console.log('createdSocietaData.cantiere ', createdSocietaData.societa);
  //       this.openSnackbar(`Nuovo cantiere ${createdSocietaData.societa.name} creato`)
  //       this.societa = [...this.societa, createdSocietaData.societa];
  //       this.cd.detectChanges();
  //     },
  //     error: error => console.error("Errore nella creazione del nuovo cantiere: ", error)
  //   })
  // }

  // private openSnackbar(content: string): void {
  //   this.snackBar.openFromComponent(SnackbarComponent, {
  //     duration: 2 * 1000,
  //     data: { content: content }
  //   });
  // }
}

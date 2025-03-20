import { MatSnackBar } from '@angular/material/snack-bar';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, inject, Inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../Models/User';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { GestioneFilters, GestioneService } from '../../Services/gestione/gestione.service';
import {Sort, MatSortModule, MatSort} from '@angular/material/sort';
import { SortService } from '../../../Common-services/sort/sort.service';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';

@Component({
  selector: 'app-utenti-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSortModule
  ],
  templateUrl: './utenti-table.component.html',
  styleUrl: './utenti-table.component.css',
})
export class UtentiTableComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('utentiTable', {static: false}) utentiTable!: MatTable<User>;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['Id', 'Utente', 'Username', 'E-mail', 'Ruolo', 'Stato', 'Azioni'];
  utentiTableData = new MatTableDataSource<User>();
  private snackBar = inject(MatSnackBar);
  @Input() users!: User[];
  @Output() usersChange = new EventEmitter<User[]>();

  constructor(
    private gestioneService: GestioneService,
    private sortService: SortService,
    private cd: ChangeDetectorRef,
    private router: Router
  ){}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users']) {
      this.utentiTableData.data = this.users;
    }
  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      this.utentiTableData.data = this.users;

      this.utentiTableData.sort = this.sort;

      this.utentiTable.renderRows();
      this.cd.detectChanges();
    });

    this.gestioneService.filterUsers$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (gestoneFilters: GestioneFilters | null) => {
        if(gestoneFilters){
          this.utentiTableData.data = this.gestioneService.filterUsersByUsernameResearchAndRoles(this.users, gestoneFilters);
        }
      },
      error: error => console.error("Errore nell'applicazione dei filtri sugli utenti: ", error)
    });
  }

  /**
   * Mostra il profilo di un utente navigando alla pagina del suo profilo per modificarne gli attributi
   * @param user utente di cui visionare il profilo da poter modificare
   */
  showProfile(user: User){
    const userId = user.id;
    this.router.navigate(['/profile', userId]);
  }

  /**
   * @param users utenti da ordinare
   * @returns Richiama la funzione nel servizio per ordinare gli utenti
   */
  sortUsersByMatSort(users: User[]): User[]{
    return this.sortService.sortUsersByMatSort(users, this.sort);
  }

  disabilitateUser(user: User){
    const userId = user.id;
    this.gestioneService.disabilitateUser(userId).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.users = this.users.map(user => {
          if (user.id === userId) {
            return { ...user, active: false } as User;
          }
          return user;
        });

        this.utentiTableData.data = this.users;

        this.openSnackbar(`Utente ${user.username} disabilitato`);
      },
      error: error => console.error(`Errore nella cancellazione dell'utente con id ${userId}: ${error}`)
    });
  }

  ablitateUser(user: User){
    const userId = user.id;
    this.gestioneService.disabilitateUser(userId).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.users = this.users.map(user => {
          if (user.id === userId) {
            return { ...user, active: true } as User;
          }
          return user;
        });

        this.usersChange.emit(this.users);

        this.utentiTableData.data = this.users;


        this.openSnackbar(`Utente ${user.username} abilitato`);
      },
      error: error => console.error(`Errore nella cancellazione dell'utente con id ${userId}: ${error}`)
    });
  }

  deleteUser(user: User){
    const userId = user.id;
    this.gestioneService.deleteUserById(userId).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.users = this.users.filter(user => user.id != userId);
        this.utentiTableData.data = this.users;
        this.usersChange.emit(this.users);
        this.openSnackbar(`Utente ${user.username} eliminato`);
      },
      error: error => console.error(`Errore nella cancellazione dell'utente con id ${userId}: ${error}`)
    });
  }

  openSnackbar(content: string): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      duration: 2 * 1000,
      data: { content: content }
    });
  }
}

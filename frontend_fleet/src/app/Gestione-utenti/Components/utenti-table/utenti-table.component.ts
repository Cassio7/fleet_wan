import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SortService } from '../../../Common-services/sort/sort.service';
import { User } from '../../../Models/User';
import { openSnackbar } from '../../../Utils/snackbar';
import {
  GestioneFilters,
  GestioneService,
} from '../../Services/gestione/gestione.service';
import { DeleteUtenteDialogComponent } from '../delete-utente-dialog/delete-utente-dialog.component';

@Component({
  selector: 'app-utenti-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSortModule,
  ],
  templateUrl: './utenti-table.component.html',
  styleUrl: './utenti-table.component.css',
})
export class UtentiTableComponent implements AfterViewInit {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('utentiTable', { static: false }) utentiTable!: MatTable<User>;
  @ViewChild(MatSort) sort!: MatSort;
  readonly dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'Id',
    'Utente',
    'Username',
    'Online',
    'E-mail',
    'Ruolo',
    'Stato',
    'Eliminato',
    'Azioni',
  ];
  utentiTableData = new MatTableDataSource<User>();
  private snackBar = inject(MatSnackBar);
  @Input() users!: User[];
  @Output() usersChange = new EventEmitter<User[]>();

  constructor(
    private gestioneService: GestioneService,
    private sortService: SortService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}
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

    this.gestioneService.filterUsers$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (gestoneFilters: GestioneFilters | null) => {
        if (gestoneFilters) {
          this.utentiTableData.data =
            this.gestioneService.filterUsersByUsernameResearchAndRoles(
              this.users,
              gestoneFilters
            );
        }
      },
      error: (error) =>
        console.error(
          "Errore nell'applicazione dei filtri sugli utenti: ",
          error
        ),
    });
  }

  /**
   * Mostra il profilo di un utente navigando alla pagina del suo profilo per modificarne gli attributi
   * @param user utente di cui visionare il profilo da poter modificare
   */
  showProfile(user: User) {
    const userId = user.id;
    this.router.navigate(['/profile', userId]);
  }

  /**
   * @param users utenti da ordinare
   * @returns Richiama la funzione nel servizio per ordinare gli utenti
   */
  sortUsersByMatSort(users: User[]): User[] {
    return this.sortService.sortUsersByMatSort(users, this.sort);
  }

  /**
   * Disabilita un utente
   * @param user utente da disabilitare
   */
  disabilitateUser(user: User) {
    const userId = user.id;
    this.gestioneService
      .disabilitateUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.users = this.users.map((user) => {
            if (user.id === userId) {
              return { ...user, active: false } as User;
            }
            return user;
          });

          this.utentiTableData.data = this.users;

          openSnackbar(this.snackBar, `Utente ${user.username} disabilitato`);
        },
        error: (error) =>
          console.error(
            `Errore nella cancellazione dell'utente con id ${userId}: ${error}`
          ),
      });
  }

  /**
   * Abilita un utente
   * @param user utente da Abilitare
   */
  ablitateUser(user: User) {
    const userId = user.id;
    this.gestioneService
      .abilitateUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.users = this.users.map((user) => {
            if (user.id === userId) {
              return { ...user, active: true } as User;
            }
            return user;
          });

          this.usersChange.emit(this.users);

          this.utentiTableData.data = this.users;

          openSnackbar(this.snackBar, `Utente ${user.username} abilitato`);
        },
        error: (error) =>
          console.error(
            `Errore nella cancellazione dell'utente con id ${userId}: ${error}`
          ),
      });
  }

  /**
   * Elimina un utente
   * @param user utente da eliminare
   */
  deleteUser(user: User) {
    const userId = user.id;

    const dialogRef = this.dialog.open(DeleteUtenteDialogComponent, {
      data: { username: user.username },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.gestioneService
            .deleteUserById(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.users = this.users.filter((user) => user.id != userId);
                this.utentiTableData.data = this.users;
                this.usersChange.emit(this.users);
                openSnackbar(this.snackBar, `Utente ${user.username} eliminato`);
              },
              error: (error) =>
                console.error(
                  `Errore nella cancellazione dell'utente con id ${userId}: ${error}`
                ),
            });
        } else {
          openSnackbar(this.snackBar, 'Eliminazione utente annullata');
        }
      });
  }

  /**
   * Alterna lo stato di un utente attivo/disattivo
   * @param user utente di cui alternare lo stato
   */
  toggleUserAbilitation(user: User) {
    if (user.active) {
      this.disabilitateUser(user);
    } else {
      this.ablitateUser(user);
    }
  }

}

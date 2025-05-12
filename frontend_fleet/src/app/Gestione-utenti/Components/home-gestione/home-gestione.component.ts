import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { User } from '../../../Models/User';
import { openSnackbar } from '../../../Utils/snackbar';
import { GestioneFiltersComponent } from "../gestione-filters/gestione-filters.component";
import { UtentiCreateDialogComponent } from '../utenti-create-dialog/utenti-create-dialog.component';
import { UtentiTableComponent } from "../utenti-table/utenti-table.component";

export interface DialogData {
  animal: string;
  name: string;
}
@Component({
  selector: 'app-home-gestione',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule, MatButtonModule, UtentiTableComponent, GestioneFiltersComponent],
  templateUrl: './home-gestione.component.html',
  styleUrl: './home-gestione.component.css'
})
export class HomeGestioneComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  users: User[] = [];
  snackBar = inject(MatSnackBar);

  constructor(private authService: AuthService, private cd: ChangeDetectorRef){}

  readonly dialog = inject(MatDialog);

  createNewUser(): void {
    const dialogRef = this.dialog.open(UtentiCreateDialogComponent);

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result !== undefined) {
        const { name, surname, username, email, role, password = true } = result;
        const newUser = new User(name, surname, username, email, role, password);

        this.createUser(newUser);
      }
    });
  }

  createUser(user: User){
    this.authService.createUser(user).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: {message: string, user: User}) => {
        openSnackbar(this.snackBar, "Utente creato con successo!");
        this.users = [...this.users, response.user];
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nella creazione dell'utente: ", error)
    });
  }


  ngOnDestroy(): void {
   this.destroy$.next()
   this.destroy$.complete();
  }

  ngOnInit(): void {
    this.authService.getAllUser().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel recupero di tutti gli utenti: ",error)
    });
  }

}

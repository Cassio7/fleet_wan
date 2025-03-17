import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatTable, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../Models/User';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-utenti-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './utenti-table.component.html',
  styleUrl: './utenti-table.component.css'
})
export class UtentiTableComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('utentiTable', {static: false}) utentiTable!: MatTable<User>;
  displayedColumns: string[] = ['Id', 'Utente', 'Username', 'E-mail', 'Ruolo', 'Stato', 'Azioni'];
  utentiTableData: User[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ){}


  ngAfterViewInit(): void {
    this.authService.getAllUser().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (users: User[]) => {
        this.utentiTableData = users.filter(user => user.role != "Admin");
        this.utentiTable.renderRows();
      },
      error: error => console.error("Errore nel recupero di tutti gli utenti: ",error)
    });
  }

  /**
   * Mostra il profilo di un utente navigando alla pagina del suo profilo per modificarne gli attributi
   * @param user utente di cui visionare il profilo da poter modificare
   */
  showProfile(user: User){
    this.router.navigate(['/profile', user.name, user.id]);
  }

  disabilitateUser(user: User){

  }

  deleteUser(user: User){

  }
}

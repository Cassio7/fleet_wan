import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UtentiTableComponent } from "../utenti-table/utenti-table.component";
import { GestioneFiltersComponent } from "../gestione-filters/gestione-filters.component";
import { AuthService } from '../../../Common-services/auth/auth.service';
import { User } from '../../../Models/User';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home-gestione',
  standalone: true,
  imports: [CommonModule, MatButtonModule, UtentiTableComponent, GestioneFiltersComponent],
  templateUrl: './home-gestione.component.html',
  styleUrl: './home-gestione.component.css'
})
export class HomeGestioneComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  users!: User[];

  constructor(private authService: AuthService, private cd: ChangeDetectorRef){}

  ngOnDestroy(): void {
   this.destroy$.next()
   this.destroy$.complete();
  }

  ngOnInit(): void {
    this.authService.getAllUser().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (users: User[]) => {
        this.users = users;
        console.log('users fetched from home getsione: ', users);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel recupero di tutti gli utenti: ",error)
    });
  }

  createUser(){

  }
}

import { AfterViewInit, Component, Input } from '@angular/core';
import { User } from '../../../Models/User';
import { CommonModule } from '@angular/common';
import { PasswordResetComponent } from "../password-reset/password-reset.component";
import { DatiUtenteComponent } from "../dati-utente/dati-utente.component";
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [
    CommonModule,
    PasswordResetComponent,
    DatiUtenteComponent
],
  templateUrl: './user-home.component.html',
  styleUrl: './user-home.component.css'
})
export class UserHomeComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  @Input() user!: User;

  header = {
    title: "",
    subtitle: ""
  }

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute){}

  ngAfterViewInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (params) => {
        const userId = params["id"];
        this.authService.getUserInfoById(userId).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user: User) => {
            this.user = user;
            this.user.id = userId;

            this.header.title = `Profilo ${this.user.name} ${this.user.surname}`;
            this.header.subtitle = "pannello modifica";
          },
          error: error => console.error("Errore nel recupero delle informazioni dell'utente: ", error)
        });
      },
      error: error => console.error("Errore nella ricezione dei parametri dall'url: ", error)
    });
  }
}

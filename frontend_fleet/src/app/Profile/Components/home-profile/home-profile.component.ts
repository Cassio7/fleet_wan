import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ProfileDataComponent } from "../profile-data/profile-data.component";
import { ProfilePswResetComponent } from "../profile-psw-reset/profile-psw-reset.component";
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { User } from '../../../Models/User';

@Component({
  selector: 'app-home-profile',
  standalone: true,
  imports: [CommonModule, ProfileDataComponent, ProfilePswResetComponent],
  templateUrl: './home-profile.component.html',
  styleUrl: './home-profile.component.css'
})
export class HomeProfileComponent {
  private readonly destroy$: Subject<void> = new Subject<void>();

  @Input() user!: User;

  header = {
    title: "",
    subtitle: ""
  }

  constructor(
    private authService: AuthService
  ){}

  ngAfterViewInit(): void {
    this.authService.getUserInfo().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: User) => {
        console.log('user fetched: ', user);
        this.user = user;

        this.header.title = `Profilo`;
        this.header.subtitle = "modifica i tuoi dati";
      },
      error: error => console.error("Errore nell'ottenere le informazioni dell'utente attuale: ", error)
    });
  }
}

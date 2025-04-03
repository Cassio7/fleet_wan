import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { ProfileDataComponent } from "../profile-data/profile-data.component";
import { ProfilePswResetComponent } from "../profile-psw-reset/profile-psw-reset.component";
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { User } from '../../../Models/User';
import { NavigationService } from '../../../Common-services/navigation/navigation.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ProfileDataComponent, ProfilePswResetComponent],
  templateUrl: './home-profile.component.html',
  styleUrl: './home-profile.component.css'
})
export class HomeProfileComponent implements OnInit, AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  @Input() user!: User;

  previous_url: string | null = '/dashboard';
  goBack_text: string = 'Torna alla dashboard';

  header = {
    title: "",
    subtitle: ""
  }

  constructor(
    private authService: AuthService,
    private navigationService: NavigationService,
    private route: ActivatedRoute,
    private router: Router
  ){}

  ngOnInit(): void {
    this.previous_url = this.navigationService.getPreviousUrl() || null;

    switch (this.previous_url) {
      case '/dashboard':
        this.goBack_text = 'Torna alla dashboard';
        break;
      case '/home-mezzi':
        this.goBack_text = 'Torna al parco mezzi';
        break;
      case '/storico-mezzi':
        this.goBack_text = 'Torna allo storico mezzi';
        break;
      case '/home-mappa':
        this.goBack_text = 'Torna alla mappa dei mezzi';
        break;
      case '/scarico-letture':
        this.goBack_text = 'Torna allo scarico delle letture';
        break;
      case '/notifications':
        this.goBack_text = "Torna alla visualizzazione delle notifiche";
        break;
      default:
        if (this.previous_url?.includes("dettaglio-mezzo")) {
          const match = this.previous_url.match(/dettaglio-mezzo\/(\d+)/);
          const veId = match ? match[1] : "";
          this.goBack_text = `Torna al dettaglio del mezzo ${veId}`;
        }
    }
  }

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

  goBack(): void {
    this.router.navigate([this.previous_url || '/dashboard']);
  }
}

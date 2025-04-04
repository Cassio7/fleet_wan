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

  previous_url: string = '/dashboard';
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
    this.previous_url = this.navigationService.getPreviousUrl() || "";

    this.goBack_text = this.navigationService.getGoBackTextByUrl(this.previous_url);
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

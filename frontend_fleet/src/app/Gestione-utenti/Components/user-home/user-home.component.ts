import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { User } from '../../../Models/User';
import { CommonModule } from '@angular/common';
import { PasswordResetComponent } from "../password-reset/password-reset.component";
import { DatiUtenteComponent } from "../dati-utente/dati-utente.component";
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WorksiteAssociationsKanbanComponent } from "../worksite-associations-kanban/worksite-associations-kanban.component";
import { AssociationsService, getAssociationsResponse } from '../../Services/associations/associations.service';
import { Association } from '../../../Models/Association';
import { WorkSite } from '../../../Models/Worksite';
import { Company } from '../../../Models/Company';
import { CompanyAssociationsKanbanComponent } from "../company-associations-kanban copy/company-associations-kanban.component";

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [
    CommonModule,
    PasswordResetComponent,
    DatiUtenteComponent,
    MatIconModule,
    MatButtonModule,
    WorksiteAssociationsKanbanComponent,
    CompanyAssociationsKanbanComponent
],
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserHomeComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

  @Input() user!: User;
  associationResponse!: getAssociationsResponse;

  freeWorksites: WorkSite[] = [];

  header = {
    title: "",
    subtitle: ""
  };

  constructor(
    private associationsService: AssociationsService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        const userId = params["id"];
        this.authService.getUserInfoById(userId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (user: User) => {
            this.user = user;
            this.user.id = userId;

            this.header.title = `Profilo ${this.user.name} ${this.user.surname}`;
            this.header.subtitle = "pannello modifica";

            this.getAssociationsById(user.id);
          },
          error: (error) => console.error("Errore nel recupero delle informazioni dell'utente: ", error)
        });
      },
      error: (error) => console.error("Errore nella ricezione dei parametri dall'url: ", error)
    });
  }

  private getAssociationsById(id: number) {
    this.associationsService.getAssociationsByUserId(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: getAssociationsResponse) => {
        console.log('response: ', response);
        if (response) {
          this.associationResponse = response;
          this.cd.detectChanges();  // Trigger change detection manually
        }
      },
      error: (error) => console.error(`Errore nell'ottenimento delle associazioni dell'utente con id ${id}: `, error)
    });
  }

  goBack() {
    this.router.navigate(['/gestione-utenti']);
  }
}

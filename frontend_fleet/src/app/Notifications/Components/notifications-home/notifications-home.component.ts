import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NotificationsTableComponent } from "../notifications-table/notifications-table.component";
import { NotificationService } from '../../../Common-services/notification/notification.service';
import { Subject, takeUntil } from 'rxjs';
import { Notifica } from '../../../Models/Notifica';
import { CommonModule } from '@angular/common';
import { NotificationsFiltersComponent } from "../notifications-filters/notifications-filters.component";
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../../Common-services/navigation/navigation.service';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';

@Component({
  selector: 'app-notifications-home',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    NotificationsTableComponent,
    NotificationsFiltersComponent
],
  templateUrl: './notifications-home.component.html',
  styleUrl: './notifications-home.component.css'
})
export class NotificationsHomeComponent implements OnInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  notifiche: Notifica[] = [];
  displayedNotifiche: Notifica[] = [];

  goBack_text: string = "";
  previous_url: string = "/dashboard";


  constructor(
    private notificationService: NotificationService,
    private navigationService: NavigationService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef,
    private router: Router
  ){}

  ngOnInit(): void {
    this.previous_url = this.navigationService.getPreviousUrl() || "";

    if (this.previous_url) {
      this.sessionStorageService.setItem('navbar_previous_url', this.previous_url);
    } else if (this.sessionStorageService.getItem('navbar_previous_url')) {
      this.previous_url = this.sessionStorageService.getItem('navbar_previous_url');
    }

    this.goBack_text = this.navigationService.getGoBackTextByUrl(this.previous_url);

    this.notificationService.getAllNotifications().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (notifiche: Notifica[]) => {
        console.log('notifications fetched from notifiche home: ', notifiche);
        this.notifiche = notifiche;
        this.displayedNotifiche = notifiche;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'ottenimento di tutte le notifiche: ", error)
    });
  }

  goBack(){
    this.router.navigate([this.previous_url]);
  }
}

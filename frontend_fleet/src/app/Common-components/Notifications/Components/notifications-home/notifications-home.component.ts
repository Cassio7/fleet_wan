import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { skip, Subject, takeUntil } from 'rxjs';
import { NavigationService } from '../../../../Common-services/navigation/navigation.service';
import { NotificationService } from '../../../../Common-services/notification/notification.service';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { Notifica } from '../../../../Models/Notifica';
import { NotificationsFiltersComponent } from "../notifications-filters/notifications-filters.component";
import { NotificationsTableComponent } from "../notifications-table/notifications-table.component";

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
        this.notifiche = notifiche;
        this.displayedNotifiche = notifiche;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'ottenimento di tutte le notifiche: ", error)
    });

    this.handleUpdatedNotification();
    this.handleNotificationDelete();
  }

  /**
   * Gestisce la reazione alla cancellazione di una notifica
   */
  private handleNotificationDelete(){
      this.notificationService.deletedNotification$.pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (response: { key: string }) => {
          this.notifiche = this.notifiche.filter(notifica => notifica.key != response.key);
          this.cd.detectChanges();
        },
        error: (error: any) => console.error("Errore nella ricezione della notifica letta dalla navbar: ", error)
      });
    }

  /**
   * Gestisce la reazione all'aggiornamento "letta/non letta" di una notifica
   */
    private handleUpdatedNotification(){
      this.notificationService.updatedNotification$.pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (notification: Notifica | null) => {
          if (notification) {
            this.notifiche = this.notifiche.map(notifica => {
              if (notifica.key === notification.key) {
                return { ...notifica, isRead: notification.isRead };
              }
              return { ...notifica };
            });

            this.displayedNotifiche = [...this.notifiche];

            this.cd.detectChanges();
          }
        },
        error: error => console.error("Errore nella ricezione della notifica letta dalla navbar: ", error)
      });
    }

  goBack(){
    this.router.navigate([this.previous_url]);
  }
}

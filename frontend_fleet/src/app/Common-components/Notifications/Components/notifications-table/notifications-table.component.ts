import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../../Common-services/notification/notification.service';
import { Notifica } from '../../../../Models/Notifica';
import { openSnackbar } from '../../../../Utils/snackbar';
import { NotificationsFilterService } from '../../Services/notifications-filter/notifications-filter.service';

@Component({
  selector: 'app-notifications-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTableModule
  ],
  templateUrl: './notifications-table.component.html',
  styleUrl: './notifications-table.component.css'
})
export class NotificationsTableComponent implements OnChanges, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('notificheTable') notificheTable!: MatTable<Notifica>;

  displayedColumns: string[] = ['Id', 'Autore', 'Tipologia', 'Contenuto', 'Data Creazione', 'Stato lettura', 'Azioni'];
  notificheTableData = new MatTableDataSource<Notifica>();
  snackbar: MatSnackBar = inject(MatSnackBar);
  @Input() notifiche: Notifica[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notifiche']) {
      this.notificheTableData.data = this.notifiche;
    }
  }

  constructor(
    private notificationsFilterService: NotificationsFilterService,
    private notificationService: NotificationService
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateNotificationStatus(notification: Notifica) {
    //timeout del bottone
    notification.isButtonDisabled = true;
    setTimeout(() => {
      notification.isButtonDisabled = false;
    }, 2000);

    this.notificationService.updateNotificationReadStatus(notification.key)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { notification: Notifica, message: string }) => {
          const { notification: updatedNotification } = response;
          this.notificationService.updatedNotification$.next(updatedNotification);
        },
        error: error => {
          console.error("Errore nell'aggiornamento della notifica: ", error);
        }
      });
  }


  deleteNotification(notification: Notifica){
    this.notificationService.deleteNotification(notification.key).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: {message: string, notification: Notifica}) => {
        this.notificheTableData.data = this.notificheTableData.data.filter(notifica => notifica.key != notification.key);
        this.notificationService.deletedNotification$.next({key: notification.key});
        openSnackbar(this.snackbar, "Notifica eliminata");
      },
      error: error => console.error("Errore nell'eliminazione della notifica: ", error)
    });
  }
}

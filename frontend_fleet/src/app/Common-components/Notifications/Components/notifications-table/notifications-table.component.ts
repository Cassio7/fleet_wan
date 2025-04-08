import { AfterViewInit, Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { Notifica } from '../../../../Models/Notifica';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationsFilterService } from '../../Services/notifications-filter/notifications-filter.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notifications-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule
  ],
  templateUrl: './notifications-table.component.html',
  styleUrl: './notifications-table.component.css'
})
export class NotificationsTableComponent implements OnChanges, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('notificheTable') notificheTable!: MatTable<Notifica>;

  displayedColumns: string[] = ['Id', 'Autore', 'Tipologia', 'Contenuto', 'Data Creazione', 'Stato lettura'];
  notificheTableData = new MatTableDataSource<Notifica>();
  @Input() notifiche: Notifica[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notifiche'] && changes['notifiche'].currentValue) {
      console.log('notifiche changed:', changes['notifiche'].currentValue);
      this.notificheTableData.data = this.notifiche;
      console.log('this.notificheTableData.data: ', this.notificheTableData.data);
    }
  }

  constructor(
    private notificationsFilterService: NotificationsFilterService
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateNotificationStatus(notification: Notifica) {
    this.notificationsFilterService.updateNotificationReadStatus(notification.key)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { notification: Notifica, message: string }) => {
          const { notification } = response;

          const index = this.notificheTableData.data.findIndex((notif) => notif.key === notification.key);

          if (index !== -1) {
            this.notificheTableData.data[index].isRead = notification.isRead;
          }
        },
        error: error => {
          console.error("Errore nell'aggiornamento della notifica: ", error);
        }
      });
  }


}

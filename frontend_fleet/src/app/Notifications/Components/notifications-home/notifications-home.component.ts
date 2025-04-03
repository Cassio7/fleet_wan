import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NotificationsTableComponent } from "../notifications-table/notifications-table.component";
import { NotificationService } from '../../../Common-services/notification/notification.service';
import { Subject, takeUntil } from 'rxjs';
import { Notifica } from '../../../Models/Notifica';

@Component({
  selector: 'app-notifications-home',
  standalone: true,
  imports: [NotificationsTableComponent],
  templateUrl: './notifications-home.component.html',
  styleUrl: './notifications-home.component.css'
})
export class NotificationsHomeComponent implements OnInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  notifiche: Notifica[] = [];


  constructor(
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.notificationService.getAllNotifications().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (notifiche: Notifica[]) => {
        console.log('notifications fetched from notifiche home: ', notifiche);
        this.notifiche = notifiche;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'ottenimento di tutte le notifiche: ", error)
    });
  }

}

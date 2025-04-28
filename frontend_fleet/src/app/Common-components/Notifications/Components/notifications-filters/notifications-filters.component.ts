import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Notifica } from '../../../../Models/Notifica';
import { NotificationsFilterService } from '../../Services/notifications-filter/notifications-filter.service';

@Component({
  selector: 'app-notifications-filters',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './notifications-filters.component.html',
  styleUrl: './notifications-filters.component.css'
})
export class NotificationsFiltersComponent {
  username: string = "";

  @Input() notifiche!: Notifica[];
  @Output() notificheChange: EventEmitter<Notifica[]> = new EventEmitter<Notifica[]>();

  constructor(
    private notificationsFilterService: NotificationsFilterService
  ){}

  filterNotificationsByUsername(){
    const filteredNotifications = this.notificationsFilterService.filterNotificationsByUsername(this.notifiche, this.username);
    this.notificheChange.emit(filteredNotifications);
  }
}

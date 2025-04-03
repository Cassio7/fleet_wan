import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { Notifica } from '../../../Models/Notifica';

@Component({
  selector: 'app-notifications-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule
  ],
  templateUrl: './notifications-table.component.html',
  styleUrl: './notifications-table.component.css'
})
export class NotificationsTableComponent implements AfterViewInit, OnChanges {
  displayedColumns: string[] = ['Id', 'Autore', 'Tipologia', 'Contenuto', 'Data Creazione'];
  notificheTableData = new MatTableDataSource<Notifica>();
  @Input() notifiche: Notifica[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notifiche'] && changes['notifiche'].currentValue) {
      console.log('notifiche changed:', changes['notifiche'].currentValue);
      this.notificheTableData.data = this.notifiche;
    }
  }

  ngAfterViewInit(): void {
    console.log('notifiche da table in afterViewInit:', this.notifiche);
  }
}

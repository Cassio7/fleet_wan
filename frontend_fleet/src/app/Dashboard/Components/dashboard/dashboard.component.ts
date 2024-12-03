import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { BlackboxGraphCardComponent } from '../blackbox-graphs/blackbox-graph-card/blackbox-graph-card.component';
import { ErrorGraphCardComponent } from '../error graphs/error-graph-card/error-graph-card.component';
import { TableComponent } from '../table/table.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatNativeDateModule,
    MatDatepickerModule,
    RouterModule,
    MatToolbarModule,
    TableComponent,
    ErrorGraphCardComponent,
    BlackboxGraphCardComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent{

  constructor(){

  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { BlackboxGraphCardComponent } from '../blackbox-graphs/blackbox-graph-card/blackbox-graph-card.component';
import { ErrorGraphCardComponent } from '../error graphs/error-graph-card/error-graph-card.component';
import { TableComponent } from '../table/table.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RowFilterComponent } from '../row-filter/row-filter.component';
import { KebabMenuComponent } from '../kebab-menu/kebab-menu.component';

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
    MatButtonModule,
    MatToolbarModule,
    TableComponent,
    ErrorGraphCardComponent,
    BlackboxGraphCardComponent,
    RowFilterComponent,
    KebabMenuComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent{

  constructor(){

  }
}

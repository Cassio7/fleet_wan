import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { MatTableModule, MatTableDataSource, MatTable } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, timestamp } from 'rxjs';
import { History } from '../../models/History';
import { Session } from '../../models/Session';
import { CommonService } from '../../services/common service/common.service';
import { SessionApiService } from '../../services/session service/session-api.service';
import { VehiclesApiService } from '../../services/vehicles service/vehicles-api.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Vehicle } from '../../models/Vehicle';
import { ErrorGraphComponent } from "../error-graph/error-graph.component";
import { BlackboxGraphComponent } from "../blackbox-graph/blackbox-graph.component";
import { TableComponent } from "../table/table.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDrawer,
    MatDrawerContainer,
    NavbarComponent,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatNativeDateModule,
    MatDatepickerModule,
    RouterModule,
    ErrorGraphComponent,
    BlackboxGraphComponent,
    TableComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit, OnDestroy{
  @ViewChild('drawer') sidebar!: MatDrawer;

  private readonly destroy$: Subject<void> = new Subject<void>();


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private commonService: CommonService
  ){

  }



  ngAfterViewInit(): void {
    this.commonService.notifySidebar$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.sidebar.toggle();
      },
      error: () => {
        console.error("Error opening the sidebar.");
      }
    });
  }
}

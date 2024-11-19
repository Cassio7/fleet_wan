import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../Services/common service/common.service';
import { BlackboxGraphCardComponent } from '../blackbox-graphs/blackbox-graph-card/blackbox-graph-card.component';
import { ErrorGraphCardComponent } from '../error graphs/error-graph-card/error-graph-card.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { TableComponent } from '../table/table.component';

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
    TableComponent,
    ErrorGraphCardComponent,
    BlackboxGraphCardComponent
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

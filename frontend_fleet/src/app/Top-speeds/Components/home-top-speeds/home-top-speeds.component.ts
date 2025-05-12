import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TopSpeedsTableComponent } from "../top-speeds-table/top-speeds-table.component";
import { SpeedData, SpeedsService, TopSpeedsData } from '../../Services/speeds.service';
import { Subject, takeUntil } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { PodiumComponent } from "../podium/podium.component";

@Component({
  selector: 'app-home-top-speeds',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    TopSpeedsTableComponent,
    PodiumComponent
],
  templateUrl: './home-top-speeds.component.html',
  styleUrl: './home-top-speeds.component.css'
})
export class HomeTopSpeedsComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  topSpeeds!: TopSpeedsData;
  selectedRange!: string;
  displayedSpeeds: SpeedData[] = [];

  constructor(
    private speedsService: SpeedsService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.speedsService.getTopSpeeds().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (topSpeeds: TopSpeedsData) => {
        this.topSpeeds = topSpeeds;
        this.displayedSpeeds = topSpeeds.allTime;
        this.selectedRange = "All Time";
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nella ricezione delle velocità massime: ", error)
    });
  }

  setSpeedTime(time: string){
    switch(time){
      case "Yesterday":
        this.displayedSpeeds = this.topSpeeds.yesterday;
        this.selectedRange = "Yesterday";
        break;
      case "This Month":
        this.displayedSpeeds = this.topSpeeds.thisMonth;
        this.selectedRange = "This Month";
        break;
      case "Last 3 Months":
        this.displayedSpeeds = this.topSpeeds.last3Months;
        this.selectedRange = "Last 3 Months";
        break;
      case "This Year":
        this.displayedSpeeds = this.topSpeeds.thisYear;
        this.selectedRange = "This Year";
        break;
      default:
        //all time
        this.selectedRange = "All Time";
        this.displayedSpeeds = this.topSpeeds.allTime;
    }
  }
}

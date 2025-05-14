import { Component, Input, OnChanges, SimpleChanges, ViewChild, viewChild } from '@angular/core';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SpeedData, TopSpeedsData } from '../../Services/speeds.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-top-speeds-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatTooltipModule,
    MatIconModule
  ],
  templateUrl: './top-speeds-table.component.html',
  styleUrl: './top-speeds-table.component.css'
})
export class TopSpeedsTableComponent implements OnChanges{
  @Input() speeds!: SpeedData[];

  constructor(
    private router: Router
  ){}

  displayedColumns: string[] = ["placement", "plate", "veId", "speed"];
  @ViewChild('speedsTable') speedsTable!: MatTable<SpeedData>;
  speedsTableData: MatTableDataSource<SpeedData> = new MatTableDataSource<SpeedData>();

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['speeds'] && this.speeds)
      this.speedsTableData.data = this.speeds;
  }

  showDetail(veId: number) {
    this.router.navigate(['/dettaglio-mezzo', veId]);
  }
}

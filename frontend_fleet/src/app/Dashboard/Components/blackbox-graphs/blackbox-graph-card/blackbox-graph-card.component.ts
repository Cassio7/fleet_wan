import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { BlackboxBarGraphComponent } from "../blackbox-bar-graph/blackbox-bar-graph.component";
import { BlackboxPieGraphComponent } from "../blackbox-pie-graph/blackbox-pie-graph.component";

@Component({
  selector: 'app-blackbox-graph-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    BlackboxBarGraphComponent,
    BlackboxPieGraphComponent
],
  templateUrl: './blackbox-graph-card.component.html',
  styleUrl: './blackbox-graph-card.component.css'
})
export class BlackboxGraphCardComponent implements AfterViewInit{
  @ViewChild('graphSelect') graphSelect!: MatSelect;
  pieGraph: boolean = true;
  barGraph: boolean = false;

  constructor(
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    if(this.graphSelect){
      this.graphSelect.value = 'pie';
      this.cd.detectChanges();
    }
  }

  changeGraph(graph: string): void {
    switch (graph) {
      case 'pie':
        this.barGraph = false;
        this.pieGraph = true;
        break;
      case 'bar':
        this.pieGraph = false;
        this.barGraph = true;
        break;
    }
    this.cd.detectChanges();
  }
}

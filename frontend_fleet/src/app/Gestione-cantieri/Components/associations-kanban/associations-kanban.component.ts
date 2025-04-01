import { AfterViewInit, Component, Input } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Vehicle } from '../../../Models/Vehicle';
import { WorkSite } from '../../../Models/Worksite';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-associations-kanban',
  standalone: true,
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, MatIconModule],
  templateUrl: './associations-kanban.component.html',
  styleUrl: './associations-kanban.component.css'
})
export class AssociationsKanbanComponent implements AfterViewInit{
  @Input() worksiteVehicles: Vehicle[] = [];
  @Input() freeVehicles: Vehicle[] = [];

  worksiteList: Vehicle[] = [];

  freeList: Vehicle[] = [];

  ngAfterViewInit(): void {
    console.log('worksiteVehicles: ', this.worksiteVehicles);
    console.log('this.freeVehicles: ', this.freeVehicles);
    this.worksiteVehicles.forEach(vehicle => {
      this.worksiteList.push(vehicle)
    });
    this.freeVehicles.forEach(vehicle => {
      this.freeList.push(vehicle)
    });
  }

  drop(event: CdkDragDrop<Vehicle[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}

import { Component, EventEmitter, Input, Output, WritableSignal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { WorkSite } from '../../../Models/Worksite';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { FormsModule } from '@angular/forms';
import { Vehicle } from '../../../Models/Vehicle';

@Component({
  selector: 'app-cantiere-edit-filters',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './cantiere-edit-filters.component.html',
  styleUrl: './cantiere-edit-filters.component.css'
})
export class CantiereEditFiltersComponent {
  plate: string = "";

  @Input() cantiere!: WorkSite;
  @Output() cantiereChange: EventEmitter<WorkSite> = new EventEmitter<WorkSite>();
  @Output() plateResearch: EventEmitter<string> = new EventEmitter<string>();

  constructor(private plateFilterService: PlateFilterService){}

  searchPlate() {
    this.cantiereChange.emit(this.cantiere);
    this.plateResearch.emit(this.plate);
  }
}

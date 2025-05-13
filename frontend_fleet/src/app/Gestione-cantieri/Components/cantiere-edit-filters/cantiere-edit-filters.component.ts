import { Component, EventEmitter, Input, model, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { WorkSite } from '../../../Models/Worksite';

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

  cantiere = model<WorkSite>();
  @Output() plateResearch: EventEmitter<string> = new EventEmitter<string>();

  constructor(private plateFilterService: PlateFilterService){}

  searchPlate() {
    this.plateResearch.emit(this.plate);
  }
}

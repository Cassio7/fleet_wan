import { Component, Input } from '@angular/core';
import { SessionFiltersComponent } from "../session-filters/session-filters.component";
import { SessionTableComponent } from "../session-table/session-table.component";
import { Vehicle } from '../../../Models/Vehicle';

@Component({
  selector: 'app-session-hystories',
  standalone: true,
  imports: [SessionFiltersComponent, SessionTableComponent],
  templateUrl: './session-hystories.component.html',
  styleUrl: './session-hystories.component.css'
})
export class SessionHystoriesComponent {
    @Input() vehicle!: Vehicle;
}

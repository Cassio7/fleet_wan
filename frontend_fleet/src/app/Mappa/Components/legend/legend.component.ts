import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MapService } from '../../../Common-services/map/map.service';

@Component({
  selector: 'app-legend',
  standalone: true,
  imports: [MatListModule],
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.css'
})
export class LegendComponent {
  constructor(
    public mapService: MapService
  ){}
}

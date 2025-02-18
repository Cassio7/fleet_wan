import { AfterViewInit, Component } from '@angular/core';
import { MapComponent } from "../../../../Common-components/map/map.component";

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [MapComponent],
  templateUrl: './home-map.component.html',
  styleUrl: './home-map.component.css'
})
export class HomeMapComponent implements AfterViewInit{

  constructor(){}

  ngAfterViewInit(): void {
  }

}

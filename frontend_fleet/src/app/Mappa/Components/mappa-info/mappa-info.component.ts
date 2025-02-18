import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-mappa-info',
  standalone: true,
  imports: [
    MatListModule,
    MatIconModule
  ],
  templateUrl: './mappa-info.component.html',
  styleUrl: './mappa-info.component.css'
})
export class MappaInfoComponent {

}

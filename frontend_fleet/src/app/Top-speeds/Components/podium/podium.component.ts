import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-podium',
  standalone: true,
  imports: [
    MatCardModule
  ],
  templateUrl: './podium.component.html',
  styleUrl: './podium.component.css'
})
export class PodiumComponent {
  @Input() first!: string;
  @Input() second!: string;
  @Input() third!: string;
}

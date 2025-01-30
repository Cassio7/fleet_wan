import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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
export class SessionHystoriesComponent implements OnChanges {
  @Input() vehicle!: Vehicle;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicle'] && changes['vehicle'].currentValue) {
      // Questo viene eseguito ogni volta che il valore di "vehicle" cambia
      console.log('Nuovo veicolo ricevuto:', changes['vehicle'].currentValue);
    }
  }

  ngOnInit() {
    // Puoi anche fare qualcosa al momento dell'inizializzazione, se necessario
    console.log('Veicolo iniziale:', this.vehicle);
  }
}

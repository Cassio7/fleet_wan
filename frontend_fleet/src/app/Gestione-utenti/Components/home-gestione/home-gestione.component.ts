import { Component } from '@angular/core';
import { UtentiTableComponent } from "../utenti-table/utenti-table.component";
import { GestioneFiltersComponent } from "../gestione-filters/gestione-filters.component";

@Component({
  selector: 'app-home-gestione',
  standalone: true,
  imports: [UtentiTableComponent, GestioneFiltersComponent],
  templateUrl: './home-gestione.component.html',
  styleUrl: './home-gestione.component.css'
})
export class HomeGestioneComponent {

}

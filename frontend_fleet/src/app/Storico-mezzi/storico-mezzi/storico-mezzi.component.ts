import { Component } from '@angular/core';
import { MapComponent } from "../../Common-components/map/map.component";
import { SessionHystoriesComponent } from "../../Common-components/Scheda-mezzo/session-hystories/session-hystories.component";
import { SessionTableComponent } from "../../Common-components/Scheda-mezzo/session-table/session-table.component";
import { ListaMezziComponent } from "../lista-mezzi/lista-mezzi.component";
import { ListaFiltersComponent } from "../lista-filters/lista-filters.component";

@Component({
  selector: 'app-storico-mezzi',
  standalone: true,
  imports: [MapComponent, SessionHystoriesComponent, ListaMezziComponent, ListaFiltersComponent],
  templateUrl: './storico-mezzi.component.html',
  styleUrl: './storico-mezzi.component.css'
})
export class StoricoMezziComponent {

}

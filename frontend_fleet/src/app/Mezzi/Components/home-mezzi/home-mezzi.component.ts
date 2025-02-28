import { Component } from '@angular/core';
import { TableComponent } from "../../../Mezzi/Components/table/table.component";
import { MezziFiltersComponent } from "../mezzi-filters/mezzi-filters/mezzi-filters.component";



@Component({
  selector: 'app-home-mezzi',
  standalone: true,
  imports: [
    TableComponent,
    MezziFiltersComponent
],
  templateUrl: './home-mezzi.component.html',
  styleUrls: ['./home-mezzi.component.css'],
})
export class HomeMezziComponent{
  constructor(){}
}

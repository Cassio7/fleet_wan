import { Component } from '@angular/core';
import { TableComponent } from "../../../Mezzi/Components/table/table.component";
import { BlackboxGraphCardComponent } from '../../../Dashboard/Components/blackbox-graphs/blackbox-graph-card/blackbox-graph-card.component';
import { ErrorGraphCardComponent } from '../../../Dashboard/Components/error graphs/error-graph-card/error-graph-card.component';



@Component({
  selector: 'app-home-mezzi',
  standalone: true,
  imports: [
    TableComponent,
    ErrorGraphCardComponent,
    BlackboxGraphCardComponent
  ],
  templateUrl: './home-mezzi.component.html',
  styleUrls: ['./home-mezzi.component.css']
})
export class HomeMezziComponent {

}

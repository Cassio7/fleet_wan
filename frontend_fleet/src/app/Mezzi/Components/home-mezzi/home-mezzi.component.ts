import { Component } from '@angular/core';
import { TableComponent } from "../../../Mezzi/Components/table/table.component";



@Component({
  selector: 'app-home-mezzi',
  standalone: true,
  imports: [
    TableComponent
],
  templateUrl: './home-mezzi.component.html',
  styleUrls: ['./home-mezzi.component.css']
})
export class HomeMezziComponent {

}

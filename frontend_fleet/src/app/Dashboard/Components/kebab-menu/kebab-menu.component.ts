import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-kebab-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonToggleModule,
    MatIconModule
  ],
  templateUrl: './kebab-menu.component.html',
  styleUrl: './kebab-menu.component.css'
})
export class KebabMenuComponent{
  selectedOption: string = "table";

  chooseKebabMenuOption(value: string){
    switch(value){
      case "table":
        //switcha a componente tabella
        break;
      case "GPS":
        //switcha a componente GPS
        break;
      case "antenna":
        //switcha a componente antenna
        break;
    }
  }
}

import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TableComponent } from "../../../Mezzi/Components/table/table.component";
import { MezziFiltersComponent } from "../mezzi-filters/mezzi-filters/mezzi-filters.component";
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Vehicle } from '../../../Models/Vehicle';



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
export class HomeMezziComponent implements AfterContentInit{
  nVehicles: number = 0;
  constructor(
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}
  ngAfterContentInit(): void {
    setTimeout(() => {
      const allVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
      this.nVehicles = allVehicles.length;
      this.cd.detectChanges();
    });
  }
}

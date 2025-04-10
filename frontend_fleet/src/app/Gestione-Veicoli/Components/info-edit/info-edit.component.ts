import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SvgService } from '../../../Common-services/svg/svg.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider, MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Group } from '../../../Models/Group';
import { WorkSite } from '../../../Models/Worksite';
import { Workzone } from '../../../Models/Workzone';
import { Rental } from '../../../Models/Rental';
import { Company } from '../../../Models/Company';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-info-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDividerModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatOptionModule
  ],
  templateUrl: './info-edit.component.html',
  styleUrl: './info-edit.component.css'
})
export class InfoEditComponent implements OnChanges{
  @Input() vehicle!: Vehicle;

  infoForm!: FormGroup;

  @Input() services: string[] = [];
  @Input() groups: Group[] = [];
  @Input() worksites: WorkSite[] =[];
  @Input() workzones: Workzone[] = [];
  @Input() rentals: Rental[] = [];
  @Input() companies: Company[] = [];



  constructor(
    public svgService: SvgService
  ){
    this.infoForm = new FormGroup({
      plate: new FormControl(''),
      service: new FormControl([]),
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['vehicle']){
      console.log('child vehicle: ', this.vehicle);
    }
  }

  save(){

  }
}

import { vehicleUpdateData } from './../../../Common-services/vehicles api service/vehicles-api.service';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Service } from '../../../Models/Service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Equipment } from '../../../Models/Equipment';

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
    MatTooltipModule,
    MatOptionModule
  ],
  templateUrl: './info-edit.component.html',
  styleUrl: './info-edit.component.css'
})
export class InfoEditComponent implements AfterViewInit, OnChanges{
  @Input() vehicle!: Vehicle;

  infoForm!: FormGroup;

  isSaveable: boolean = true;

  @Input() services: Service[] = [];
  @Input() workzones: Workzone[] = [];
  @Input() rentals: Rental[] = [];
  @Input() equipments: Equipment[] = [];


  @Output() updateVehicle: EventEmitter<vehicleUpdateData> = new EventEmitter<vehicleUpdateData>();
  states: string[] = ["Operativo", "Sospeso"];
  allestimenti: string[] = ["Blackbox + Antenna", "Blackbox"];

  constructor(
    public svgService: SvgService
  ){
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['vehicle']){
      if(!this.vehicle.rental && this.infoForm) this.infoForm.get('rentalId')?.setValue('null')
    }
  }

  ngAfterViewInit(): void {
    if(this.vehicle){
      this.infoForm = new FormGroup({
        plate: new FormControl({ value: this.vehicle.plate, disabled: true }),
        active_csv: new FormControl(this.vehicle.active),
        model_csv: new FormControl(this.vehicle.model),
        euro: new FormControl(this.vehicle.euro),
        allestimento: new FormControl(this.vehicle.allestimento),
        registration: new FormControl(this.vehicle.registration),
        fleet_number: new FormControl(this.vehicle.fleet_number),
        fleet_install: new FormControl(this.vehicle.fleet_install),
        electrical: new FormControl(this.vehicle.electrical),
        antenna_setting: new FormControl(this.vehicle.antenna_setting),
        fleet_antenna_number: new FormControl(this.vehicle.fleet_antenna_number),
        retired_event: new FormControl(this.vehicle.retired_event),
        serviceId: new FormControl(this.vehicle.service?.id),
        equipmentId: new FormControl(this.vehicle.equipment?.id),
        rentalId: new FormControl(this.vehicle.rental?.id ?? "null"),
        workzone: new FormControl(this.vehicle.workzone?.id),
      });

      console.log(this.infoForm.get('rentalId')?.value);
    }
  }

  save(){
    if(this.infoForm.get('rentalId')?.value == "null") {
      this.infoForm.get('rentalId')?.setValue(null);
    }

    this.updateVehicle.emit(this.infoForm.value);
  }
}

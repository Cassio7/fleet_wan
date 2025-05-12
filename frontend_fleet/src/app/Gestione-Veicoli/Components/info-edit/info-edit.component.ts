import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SvgService } from '../../../Common-services/svg/svg.service';
import { Equipment } from '../../../Models/Equipment';
import { Rental } from '../../../Models/Rental';
import { Service } from '../../../Models/Service';
import { Vehicle } from '../../../Models/Vehicle';
import { Workzone } from '../../../Models/Workzone';
import { vehicleUpdateData } from './../../../Common-services/vehicles api service/vehicles-api.service';

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
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatInputModule,
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

  constructor(
    public svgService: SvgService
  ){
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['vehicle']){
      if(!this.vehicle.rental && this.infoForm) this.infoForm.get('rentalId')?.setValue('null');
    }
  }

  ngAfterViewInit(): void {
    if(this.vehicle){
      this.infoForm = new FormGroup({
        model_csv: new FormControl(this.vehicle.model),
        euro: new FormControl(this.vehicle.euro),
        allestimento: new FormControl(this.vehicle.allestimento ?? false),
        registration: new FormControl(this.vehicle.registration),
        fleet_number: new FormControl(this.vehicle.fleet_number),
        fleet_install: new FormControl(this.vehicle.fleet_install),
        electrical: new FormControl(this.vehicle.electrical ?? false),
        antenna_setting: new FormControl(this.vehicle.antenna_setting),
        fleet_antenna_number: new FormControl(this.vehicle.fleet_antenna_number),
        retired_event: new FormControl(this.vehicle.retired_event),
        serviceId: new FormControl(this.vehicle.service?.id ?? null),
        equipmentId: new FormControl(this.vehicle.equipment?.id),
        rentalId: new FormControl(this.vehicle.rental?.id ?? "null"),
        workzone: new FormControl(this.vehicle.workzone?.id),
      });
    }
  }

  save(){
    if(this.infoForm.get('rentalId')?.value == "null") {
      this.infoForm.get('rentalId')?.setValue(null);
    }

    this.updateVehicle.emit(this.infoForm.value);
  }


}

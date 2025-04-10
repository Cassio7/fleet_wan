import { CommonService } from './../../../Common-services/common service/common.service';
import { MatIconModule } from '@angular/material/icon';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { InfoEditComponent } from "../info-edit/info-edit.component";
import { ActivatedRoute, Params } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { VehiclesApiService, vehicleUpdateData } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Vehicle } from '../../../Models/Vehicle';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { Group } from '../../../Models/Group';
import { WorkSite } from '../../../Models/Worksite';
import { WorkzoneService } from '../../../Common-services/workzone/workzone.service';
import { Workzone } from '../../../Models/Workzone';
import { RentalService } from '../../../Common-services/rental/rental.service';
import { Rental } from '../../../Models/Rental';
import { Company } from '../../../Models/Company';
import { GestioneSocietaService } from '../../../Common-services/Gestione-Società/Services/gestione-societa/gestione-societa.service';
import { Service } from '../../../Models/Service';
import { ServicesService } from '../../../Common-services/Services/services.service';
import { openSnackbar } from '../../../Utils/snackbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Equipment } from '../../../Models/Equipment';
import { EquipmentService } from '../../../Common-services/equipment/equipment.service';
import { CommonModule } from '@angular/common';
import { StoricoCantieriComponent } from "../../../Common-components/storico-cantieri/storico-cantieri.component";

@Component({
  selector: 'app-home-veicolo-edit',
  standalone: true,
  imports: [CommonModule, MatIconModule, InfoEditComponent, MatSnackBarModule, StoricoCantieriComponent],
  templateUrl: './home-veicolo-edit.component.html',
  styleUrl: './home-veicolo-edit.component.css'
})
export class HomeVeicoloEditComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  snackBar: MatSnackBar = inject(MatSnackBar);

  goBack_text: string = "";

  veId!: number;
  vehicle!: Vehicle;
  services: Service[] = [];
  workzones: Workzone[] = [];
  rentals: Rental[] = [];
  equipments: Equipment[] = [];

  constructor(
    private route: ActivatedRoute,
    private vehiclesApiService: VehiclesApiService,
    private workzoneService: WorkzoneService,
    private rentalService: RentalService,
    private equipmentService: EquipmentService,
    private servicesService: ServicesService,
    private vehicleApiService: VehiclesApiService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    try {
      const params = await firstValueFrom(this.route.params.pipe(takeUntil(this.destroy$)));
      this.veId = params['id'];

      this.workzones = await this.getAllWorkzones();
      this.rentals = await this.getAllRentals();
      this.services = await this.getAllServices();
      this.equipments = await this.getAllEquipments();
      const fetchedVehicle = await this.getVehicleByVeId(this.veId);
      if(fetchedVehicle) this.vehicle = fetchedVehicle;
      console.log('fetchedVehicle: ', fetchedVehicle);
      this.cd.detectChanges();
    } catch (error) {
      console.error("Errore nella ricezione del veId dall'url: ", error);
    }
  }

  updateVehicle(vehicleUpdatedData: vehicleUpdateData){
    console.log('passing this vehicleUpdatedData: ', vehicleUpdatedData);
    this.vehicleApiService.updateVehicleByVeId(this.veId, vehicleUpdatedData).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (newVehicle: Vehicle) => {
        console.log('new updated vehicle: ', newVehicle);
        this.vehicle = newVehicle;
        openSnackbar(this.snackBar, `Veicolo ${this.veId} aggiornato`);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'aggiornamento del veicolo: ",error)
    });
  }


  /**
   * Prende tutti i servizi
   * @returns promise di Equipment[]
   */
  private async getAllEquipments(): Promise<Equipment[]>{
    try{
      return firstValueFrom(this.equipmentService.getAllEquipments().pipe(takeUntil(this.destroy$)))
    }catch(error){
      console.error(`Errore nell'ottenimento di tutti i servizi: ${error}`);
    }
    return [];
  }














  /**
   * Prende tutti i servizi
   * @returns promise di Service[]
   */
  private async getAllServices(): Promise<Service[]>{
    try{
      return firstValueFrom(this.servicesService.getAllServices().pipe(takeUntil(this.destroy$)))
    }catch(error){
      console.error(`Errore nell'ottenimento di tutti i servizi: ${error}`);
    }
    return [];
  }

  /**
   * Prende tutte le società
   * @returns promise di Company[]
   */
  // private async getAllCompanies(): Promise<Company[]>{
  //   try{
  //     return firstValueFrom(this.gestioneSocietaService.getAllSocieta().pipe(takeUntil(this.destroy$)));
  //   }catch(error){
  //     console.error("Errore nell'ottenimento delle società: ", error);
  //     return [];
  //   }
  // }

  /**
   * Prende tutte le rental
   * @returns promise di Rental[]
   */
  private async getAllRentals(): Promise<Rental[]>{
    try{
      return firstValueFrom(this.rentalService.getAllRentals().pipe(takeUntil(this.destroy$)));
    }catch(error){
      console.error("Errore nell'ottenimento delle rental: ", error);
      return [];
    }
  }

  /**
   * Prende tutte le workzone
   * @returns promise di Workzone[]
   */
  private async getAllWorkzones(): Promise<Workzone[]>{
    try{
      return firstValueFrom(this.workzoneService.getAllWorkzones().pipe(takeUntil(this.destroy$)));
    }catch(error){
      console.error("Errore nell'ottenimento delle workzone: ", error);
      return [];
    }
  }

  /**
   * Prende tutti gli worksite
   * @returns promise di WorkSite[]
   */
  // private async getAllWorksites(): Promise<WorkSite[]>{
  //   try{
  //     return firstValueFrom(this.gestioneCantieriService.getAllWorksite().pipe(takeUntil(this.destroy$)));
  //   }catch(error){
  //     console.error("Errore nella ricezione di tutti i cantieri: ", error);
  //     return [];
  //   }
  // }

  /**
   * Prende tutti i gruppi
   * @returns promise di Group[]
   */
  // private async getAllGroups(): Promise<Group[]> {
  //   try {
  //     return await firstValueFrom(this.gestioneCantieriService.getAllGroups().pipe(takeUntil(this.destroy$)));
  //   } catch (error) {
  //     console.error("Errore nella ricezione di tutti i gruppi: ", error);
  //     return [];
  //   }
  // }

  /**
   * Prende un veicolo tramite il veId
   * @returns promise di Vehicle | null
   */
  private async getVehicleByVeId(veId: number): Promise<Vehicle | null> {
    try {
      return await firstValueFrom(this.vehiclesApiService.getVehicleByVeIdAdmin(veId).pipe(takeUntil(this.destroy$)));
    } catch (error) {
      console.error("Errore nella ricezione del veicolo con veId: ", error);
      return null;
    }
  }
}

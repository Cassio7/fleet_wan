import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { StoricoCantieriComponent } from "../../../Common-components/storico-cantieri/storico-cantieri.component";
import { EquipmentService } from '../../../Common-services/equipment/equipment.service';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { RentalService } from '../../../Common-services/rental/rental.service';
import { ServicesService } from '../../../Common-services/services/services.service';
import { VehiclesApiService, vehicleUpdateData } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { WorkzoneService } from '../../../Common-services/workzone/workzone.service';
import { Equipment } from '../../../Models/Equipment';
import { Rental } from '../../../Models/Rental';
import { Service } from '../../../Models/Service';
import { Vehicle } from '../../../Models/Vehicle';
import { WorkSite } from '../../../Models/Worksite';
import { WorksiteHistory } from '../../../Models/Worksite-history';
import { Workzone } from '../../../Models/Workzone';
import { openSnackbar } from '../../../Utils/snackbar';
import { ChangeWorksiteComponent } from "../change-worksite/change-worksite.component";
import { InfoEditComponent } from "../info-edit/info-edit.component";

@Component({
  selector: 'app-home-veicolo-edit',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    InfoEditComponent,
    StoricoCantieriComponent,
    ChangeWorksiteComponent
],
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
  worksites: WorkSite[] = [];
  rentals: Rental[] = [];
  equipments: Equipment[] = [];
  newWorksiteHistory!: WorksiteHistory;

  constructor(
    private route: ActivatedRoute,
    private vehiclesApiService: VehiclesApiService,
    private workzoneService: WorkzoneService,
    private rentalService: RentalService,
    private equipmentService: EquipmentService,
    private gestioneCantieriService: GestioneCantieriService,
    private servicesService: ServicesService,
    private vehicleApiService: VehiclesApiService,
    private cd: ChangeDetectorRef,
    private router: Router
  ){}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    try {
      const params = await firstValueFrom(this.route.params.pipe(takeUntil(this.destroy$)));
      this.veId = parseInt(params['id']);

      this.workzones = await this.getAllWorkzones();
      this.rentals = await this.getAllRentals();
      this.services = await this.getAllServices();
      this.equipments = await this.getAllEquipments();
      this.worksites = await this.getAllWorksites();
      const fetchedVehicle = await this.getVehicleByVeId(this.veId);
      if(fetchedVehicle) this.vehicle = fetchedVehicle;
      this.cd.detectChanges();
    } catch (error) {
      console.error("Errore nella ricezione del veId dall'url: ", error);
    }
  }

  updateVehicle(vehicleUpdatedData: vehicleUpdateData){
    this.vehicleApiService.updateVehicleByVeId(this.veId, vehicleUpdatedData).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (newVehicle: Vehicle) => {
        this.vehicle = newVehicle;
        openSnackbar(this.snackBar, `Veicolo ${this.veId} aggiornato`);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'aggiornamento del veicolo: ",error)
    });
  }

  /**
   * Salva il cambiamento del cantiere del veicolo
   * @param creationData dati di creazione
   */
  saveWorksiteHistory(creationData: {worksite: WorkSite, dateFrom: Date, comment: string}){
    const { worksite, dateFrom, comment } = creationData;
    this.gestioneCantieriService.moveVehicleInWorksite(this.veId, worksite.id, dateFrom.toString(), comment).pipe(takeUntil(this.destroy$)).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: {worksiteHistory: WorksiteHistory, message: string}) => {
        const { worksiteHistory } = response;
        this.newWorksiteHistory = response.worksiteHistory;
        const foundWorksite = this.worksites.find(worksite => worksite.id == worksiteHistory.worksite.id);
        if(foundWorksite) this.vehicle = { ...this.vehicle, worksite: foundWorksite };
        this.cd.detectChanges();
        openSnackbar(this.snackBar, `Veicolo spostato con successo nel cantiere ${creationData.worksite.name}`);
      },
      error: error => console.error("Errore nello spostamento del veicolo: ", error)
    });
  }


  /**
   * Prende tutti i servizi
   * @returns promise di Equipment[]
   */
  private async getAllWorksites(): Promise<WorkSite[]>{
    try{
      return firstValueFrom(this.gestioneCantieriService.getAllWorksite().pipe(takeUntil(this.destroy$)))
    }catch(error){
      console.error(`Errore nell'ottenimento di tutti i cantieri: ${error}`);
    }
    return [];
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

  goBack(){
    this.router.navigate(['/gestione-veicoli']);
  }
}

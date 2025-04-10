import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { InfoEditComponent } from "../info-edit/info-edit.component";
import { ActivatedRoute, Params } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
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

@Component({
  selector: 'app-home-veicolo-edit',
  standalone: true,
  imports: [InfoEditComponent],
  templateUrl: './home-veicolo-edit.component.html',
  styleUrl: './home-veicolo-edit.component.css'
})
export class HomeVeicoloEditComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  veId!: number;
  vehicle!: Vehicle;
  services: string[] = ["Raccolta", "Spazzamento", "Pedana", "Lavaggio", "Movimentazione", "Trasferenza", "Ragno", "Sanitari"];
  groups: Group[] = [];
  worksites: WorkSite[] =[];
  workzones: Workzone[] = [];
  rentals: Rental[] = [];
  companies: Company[] = [];

  constructor(
    private route: ActivatedRoute,
    private vehiclesApiService: VehiclesApiService,
    private gestioneCantieriService: GestioneCantieriService,
    private workzoneService: WorkzoneService,
    private rentalService: RentalService,
    private gestioneSocietaService: GestioneSocietaService,
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

      this.groups = await this.getAllGroups();
      this.worksites = await this.getAllWorksites();
      this.workzones = await this.getAllWorkzones();
      this.rentals = await this.getAllRentals();
      this.companies = await this.getAllCompanies();
      const fetchedVehicle = await this.getVehicleByVeId(this.veId);
      if(fetchedVehicle) this.vehicle = fetchedVehicle;
      console.log('fetchedVehicle: ', fetchedVehicle);
      this.cd.detectChanges();
    } catch (error) {
      console.error("Errore nella ricezione del veId dall'url: ", error);
    }
  }

  /**
   * Prende tutte l
   * @returns promise di Rental[]
   */
  private async getAllCompanies(): Promise<Company[]>{
    try{
      return firstValueFrom(this.gestioneSocietaService.getAllSocieta().pipe(takeUntil(this.destroy$)));
    }catch(error){
      console.error("Errore nell'ottenimento delle società: ", error);
      return [];
    }
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
   * Prende tutti gli worksite
   * @returns promise di WorkSite[]
   */
  private async getAllWorksites(): Promise<WorkSite[]>{
    try{
      return firstValueFrom(this.gestioneCantieriService.getAllWorksite().pipe(takeUntil(this.destroy$)));
    }catch(error){
      console.error("Errore nella ricezione di tutti i cantieri: ", error);
      return [];
    }
  }

  /**
   * Prende tutti i gruppi
   * @returns promise di Group[]
   */
  private async getAllGroups(): Promise<Group[]> {
    try {
      return await firstValueFrom(this.gestioneCantieriService.getAllGroups().pipe(takeUntil(this.destroy$)));
    } catch (error) {
      console.error("Errore nella ricezione di tutti i gruppi: ", error);
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

}

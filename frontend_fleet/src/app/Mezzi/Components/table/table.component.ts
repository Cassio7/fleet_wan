import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, HostListener, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';
import { VehiclesApiService } from '../../../Common-services/vehicles service/vehicles-api.service';
import { Subject, takeUntil, filter, forkJoin, take } from 'rxjs';
import { Session } from '../../../Models/Session';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { SelectService } from '../../Services/select/select.service';
import { MezziFilterService } from '../../Services/mezzi-filter/mezzi-filter.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { CookieService } from 'ngx-cookie-service';
import { JwtService } from '../../../Common-services/jwt/jwt.service';
import { NotesService } from '../../Services/notes/notes.service';
import { Note } from '../../../Models/Note';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    CommonModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatTableModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements AfterViewInit, AfterViewChecked, OnDestroy{
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;
  private readonly destroy$: Subject<void> = new Subject<void>();

  vehicleTableData = new MatTableDataSource<Vehicle>();

  sortedVehicles: Vehicle[] = [];

  displayedColumns: string[] = ["Azienda", "Targa", "Marca&modello", "Cantiere", "Anno immatricolazione", "Tipologia attrezzatura", "Allestimento", "Data-installazione-fleet", "Data-rimozione-apparato", "Notes"];

  constructor(
    public selectService: SelectService,
    public mezziFilterService: MezziFilterService,
    private sortService: SortService,
    private notesService: NotesService,
    private jwtService: JwtService,
    private vehicleApiService: VehiclesApiService,
    private sessionStorageService: SessionStorageService,
    private cookieService: CookieService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewChecked(): void {
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Riempimento dei dati della tabella, delegato interamente a fillTable
    this.fillTable();
  }

  /**
   * Esegue il riempimento della tabella controllando prima i dati nel sessionStorage.
   * Se presenti, utilizza quelli; altrimenti fa una chiamata tramite un servizio all'API.
   */
  fillTable(): void {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));

    if (allVehicles) {
      this.notesService.getAllNotes().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes: Note[] | Note)=>{
          // Utilizza i dati dal sessionStorage
          this.sortedVehicles = this.sortService.sortVehiclesByPlateAsc(allVehicles);
          this.vehicleTableData.data = this.sortedVehicles;
          this.vehicleTable.renderRows();
          this.mergeVehiclesWithNotes(allVehicles, notes);
          this.selectService.selectVehicles(this.sortedVehicles); // Seleziona tutte le opzioni dei menu delle colonne
          this.cd.detectChanges();
        },
        error: error => console.error("Errore nella ricezione delle note: ", error)
      });
    } else {
      // Recupera i dati tramite chiamata API
      forkJoin({
        vehicles: this.vehicleApiService.getAllVehicles().pipe(takeUntil(this.destroy$)),
        notes: this.notesService.getAllNotes().pipe(takeUntil(this.destroy$))
      }).subscribe({
        next: ({ vehicles, notes }: { vehicles: Vehicle[], notes: Note[] | Note }) => {
          this.mergeVehiclesWithNotes(vehicles, notes);

          this.sortedVehicles = this.sortService.sortVehiclesByPlateAsc(vehicles);
          this.vehicleTableData.data = this.sortedVehicles;
          this.sessionStorageService.setItem("allVehicles", JSON.stringify(vehicles));
          this.vehicleTable.renderRows();
          this.selectService.selectVehicles(this.sortedVehicles);
          this.cd.detectChanges();
        },
        error: error => console.error("Errore nella ricezione di veicoli o note: ", error)
      });
    }
  }


  mergeVehiclesWithNotes(vehicles: Vehicle[], notes: Note[] | Note){
    const notesArray = Array.isArray(notes) ? notes : [notes]; //rendere un array anche se nota singola

    //accorpamento delle note nei
    vehicles.forEach((vehicle) => {
      notesArray.forEach(note => {
        if(note && note.vehicle.veId == vehicle.veId){
          vehicle.note = note;
        }
      });
    });
  }

  /**
   * Viene chiamata alla selezione di un checkbox in un menu della colonna delle targhe
   * @param vehicle veicolo da cui prendere la targa
   * @param $event evento
   */
  selectTarga(vehicle: Vehicle, $event: any){
    this.selectService.updateVehiclesSelectionByPlate(this.sortedVehicles, vehicle);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles); //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Viene chiamata alla selezione di un checkbox nel menu della colonna dei modelli
   * @param vehicle veicolo da cui prendere il modello
   * @param $event evento
   */
  selectModel(vehicle: Vehicle, $event: any){
    this.selectService.updateVehiclesSelectionByModel(this.sortedVehicles, vehicle);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles); //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Viene chiamata alla selezione di un checkbox nel menu della colonna cantiere
   * @param vehicle veicolo da cui prendere la cantiere
   * @param $event evento
   */
  selectCantiere(vehicle: Vehicle, $event: any){
    this.selectService.updateVehiclesSelectionByCantiere(this.sortedVehicles, vehicle);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles); //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Viene chiamata alla selezione di un checkbox nel menu della colonna della data di installazione del fleet
   * @param vehicle veicolo da cui prendere il firstevent
   * @param $event evento
   */
  selectFirstEvent(vehicle: Vehicle, $event: any){
    this.selectService.updateVehiclesSelectionByFirstEvent(this.sortedVehicles, vehicle);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles); //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Viene chiamata alla selezione di un checkbox nel menu della colonna della data di installazione del fleet
   * @param vehicle veicolo di cui controllare se ha solo la blackbox o anche l'antenna RFID
   * @param $event evento
   */
  selectAllestimento(option: string, $event: any){
    this.selectService.updateVehiclesSelectionByAllestimento(this.sortedVehicles, option, $event.target.checked);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles); //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Richiamata ad ogni selezione di un checkbox in uno qualsiasi dei menu delle colonne
   * @param $event evento
   */
  private onSelection($event: any){
    $event.stopPropagation(); //impedisci al menu di chiudersi
    this.cd.detectChanges();
    this.vehicleTable.renderRows();
  }


  /**
   * salva una nota nel db
   * @param vehicle veicolo sul quale salvare la nota
   * @param content contenuto della nota
   */
  saveNote(vehicle: Vehicle, content: string){
    if(vehicle.note){
      vehicle.note.saved = true;
    }else{
      vehicle.note = {
        saved: true,
        content: '',
        vehicle: vehicle,
        userId: 0,
      }
    }

    const userId = this.jwtService.decodeJwt(this.cookieService.get("user")).id; //ottieni e trasforma access token

    const nota = new Note(content, vehicle, userId);//oggetto nota

    if(content){
      this.notesService.saveNoteInDB(nota).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ()=>{
          console.log("nota salvata correttamente nel db");
        },
        error: error => console.error("errore nel salvataggio della nota nel DB: ", error)
      });
    }
  }

  isVehicleNoteModified(vehicle: Vehicle, currentValue: string): boolean {
    return this.notesService.isVehicleNoteModified(vehicle, currentValue);
  }

  checkVehicleModifiedNote(vehicle: Vehicle){
    return this.notesService.checkVehicleModifiedNote(vehicle);
  }

  /**
   * Viene chiamata quando si preme sul checkbox "Seleziona tutto" di una qualsiasi colonna
   * @param column colonna a cui appartiene il menu dove si trova il checkbox
   * @param $event evento
   */
  selectDeselectAll($event: any){
    this.vehicleTableData.data = this.selectService.selectDeselectAll(this.sortedVehicles, $event);
    this.vehicleTable.renderRows();
  }

  /**
   * richiama la funzione per rimuovere i duplicati dalla lista di modelli
   * @returns funzione nel servizio
   */
  filterVehiclesModelsDuplicates(){
    return this.mezziFilterService.filterVehiclesModelsDuplicates(this.sortedVehicles);
  }

  /**
   * richiama la funzione per rimuovere i duplicati dalla lista di cantieri
   * @returns funzione nel servizio
   */
  filterVehiclesCantieriDuplicates(){
    return this.mezziFilterService.filterVehiclesCantieriDuplicates(this.sortedVehicles);
  }

  /**
   * richiama la funzione per rimuovere i duplicati dalla lista di cantieri
   * @returns funzione nel servizio
   */
  filterFirstEventsDuplicates(){
    return this.mezziFilterService.filterFirstEventsDuplicates(this.sortedVehicles);
  }

}

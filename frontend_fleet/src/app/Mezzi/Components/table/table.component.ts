import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, HostListener, inject, NgZone, OnDestroy, signal, ViewChild } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Subject, takeUntil, filter, forkJoin, take, tap } from 'rxjs';
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
import { SortService } from '../../../Common-services/sort/sort.service';
import { CookieService } from 'ngx-cookie-service';
import { NotesService } from '../../Services/notes/notes.service';
import { Note } from '../../../Models/Note';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { NoteSnackbarComponent } from '../note-snackbar/note-snackbar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { ModelFilterService } from '../../../Common-services/model-filter/model-filter.service';
import { FirstEventsFilterService } from '../../../Common-services/firstEvents-filter/first-events-filter.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MatProgressBarModule,
    MatInputModule,
    MatCheckboxModule,
    MatTableModule,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableComponent implements AfterViewInit, AfterViewChecked, OnDestroy{
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;
  private readonly destroy$: Subject<void> = new Subject<void>();
  readonly panelOpenState = signal(false);
  completedCalls: number = 0;
  loading: boolean = true;
  vehicleTableData = new MatTableDataSource<Vehicle>();
  sortedVehicles: Vehicle[] = [];
  expandedVehicle: Vehicle | null = null;

  displayedColumns: string[] = ["Azienda", "Targa", "Marca&modello", "Cantiere",
  "Anno immatricolazione", "Tipologia attrezzatura", "Allestimento",
  "Data-installazione-fleet", "Data-rimozione-apparato"];
  columnsToDisplayWithExpand = [...this.displayedColumns, "expand"];

  private snackBar = inject(MatSnackBar);
  snackbarDuration = 2; //durata snackbar in secondi

  constructor(
    public selectService: SelectService,
    private cantieriFilterService: CantieriFilterService,
    private firstEventsFilterService: FirstEventsFilterService,
    private modelFilterService: ModelFilterService,
    private sortService: SortService,
    private notesService: NotesService,
    private authService: AuthService,
    private vehicleApiService: VehiclesApiService,
    private sessionStorageService: SessionStorageService,
    private cookieService: CookieService,
    private cd: ChangeDetectorRef
  ){}


  /**
   * Apre la snackbar per la nota salvata
   */
  openSavedNoteSnackbar(): void {
    this.snackBar.openFromComponent(NoteSnackbarComponent, {
      duration: this.snackbarDuration * 1000,
    });
  }

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
    console.log(this.vehicleTableData.data[0]);
  }

  /**
   * Esegue il riempimento della tabella controllando prima i dati nel sessionStorage.
   * Se presenti, utilizza quelli; altrimenti fa una chiamata tramite un servizio all'API.
   */
  fillTable(): void {
    // Parallel API calls to fetch vehicles and notes
    forkJoin({
      vehicles: this.vehicleApiService.getAllVehicles().pipe(takeUntil(this.destroy$)),
      notes: this.notesService.getAllNotes().pipe(takeUntil(this.destroy$))
    }).subscribe({
      next: ({ vehicles, notes }: { vehicles: Vehicle[], notes: Note[] }) => {
        console.log("Vehicle table fetched vehicles: ", vehicles);
        this.sessionStorageService.setItem("allVehicles", JSON.stringify(vehicles));
        // Sort vehicles
        this.sortedVehicles = this.sortService.sortVehiclesByPlateAsc(vehicles) as Vehicle[];
        this.vehicleTableData.data = this.sortedVehicles;

        // Merge notes with vehicles
        this.mergeVehiclesWithNotes(vehicles, notes);

        // Update and render table
        this.vehicleTable.renderRows();
        this.selectService.selectVehicles(this.sortedVehicles); // Optionally select vehicles

        this.loading = false;
        this.cd.detectChanges(); // Trigger change detection
        console.log("Vehicles and notes fetched and processed.");
      },
      error: (error) => {
        console.error("Error fetching vehicles or notes: ", error);
        this.loading = false;
      }
    });
  }

  toggleExpand(vehicle: any, event: MouseEvent): void {
    event.stopPropagation(); // Prevent row click event from firing when the button is clicked
    this.expandedVehicle = this.expandedVehicle === vehicle ? null : vehicle;
  }


  /**
   * Accorpa i veicoli alla propria nota corrispondente
   * @param vehiclesData array di dati dei veicoli
   * @param notes array di note
   */
  private mergeVehiclesWithNotes(vehicles: Vehicle[], notes: Note[] | Note): void {
    const notesArray = Array.isArray(notes) ? notes : [notes]; // Rende sempre un array anche se la nota è singola

    // Accorpamento delle note nei veicoli
    vehicles.forEach((v) => {
      notesArray.forEach(note => {
        if (note && note.vehicle.veId === v.veId) {
          v.note = note; // Associa la nota al veicolo corrispondente
        }
      });
    });
  }

  /**
   * Viene chiamata alla selezione di un checkbox in un menu della colonna delle targhe
   * @param vehicle dati da cui prendere il veicolo da cui prendere la targa
   * @param $event evento
   */
  selectTarga(vehicle: Vehicle, $event: any){
    this.selectService.updateVehiclesSelectionByPlate(this.sortedVehicles, vehicle);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles) as Vehicle[]; //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Viene chiamata alla selezione di un checkbox nel menu della colonna dei modelli
   * @param vehicle veicolo da cui prendere il modello
   * @param $event evento
   */
  selectModel(vehicle: Vehicle, $event: any){
    this.selectService.updateVehiclesSelectionByModel(this.sortedVehicles, vehicle);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles) as Vehicle[]; //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Viene chiamata alla selezione di un checkbox nel menu della colonna cantiere
   * @param vehicle veicolo da cui prendere la cantiere
   * @param $event evento
   */
  selectCantiere(vehicle: Vehicle, $event: any){
    this.selectService.updateVehiclesSelectionByCantiere(this.sortedVehicles, vehicle);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles) as Vehicle[]; //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Viene chiamata alla selezione di un checkbox nel menu della colonna della data di installazione del fleet
   * @param vehicle veicolo da cui prendere il firstevent
   * @param $event evento
   */
  selectFirstEvent(vehicle: Vehicle, $event: any){
    this.selectService.updateVehiclesSelectionByFirstEvent(this.sortedVehicles, vehicle);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles) as Vehicle[]; //aggiornamento tabella con veicoli selezionati, ordinati per targa
    this.onSelection($event);
  }

  /**
   * Viene chiamata alla selezione di un checkbox nel menu della colonna della data di installazione del fleet
   * @param vehicle veicolo di cui controllare se ha solo la blackbox o anche l'antenna RFID
   * @param $event evento
   */
  selectAllestimento(option: string, $event: any){
    this.selectService.updateVehiclesSelectionByAllestimento(this.sortedVehicles, option, $event.target.checked);
    this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(this.selectService.selectedVehicles) as Vehicle[]; //aggiornamento tabella con veicoli selezionati, ordinati per targa
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
    //se il veicolo possedeva già una nota creata imposta il salvataggio di quest'ultima a true
    if(vehicle.note){
      vehicle.note.saved = true;
    }else{ //altrimenti crea una nuova nota vuota e impostala a true
      vehicle.note = {
        saved: true,
        content: '',
        vehicle: vehicle,
        userId: 0,
      }
    }

    const userId = this.authService.decodeToken(this.cookieService.get("user")).id; //ottieni e trasforma access token

    const nota = new Note(content, vehicle, userId);//creazione nuovo oggetto nota

    //salvataggio nota nel database
    this.notesService.saveNoteInDB(nota).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ()=>{
        this.openSavedNoteSnackbar();
      },
      error: error => console.error("errore nel salvataggio della nota nel DB: ", error)
    });
  }

  /**
   * Richiama la funzione nel servizio per verificare se una nota è stata modificata
   * @param vehicle veicolo di cui controllare la nota
   * @param currentValue valore attuale del campo corrispondente alla nota
   * @returns chiamata alla funzione per la verifica
   */
  isVehicleNoteModified(vehicle: Vehicle, currentValue: string): boolean {
    return this.notesService.isVehicleNoteModified(vehicle, currentValue);
  }

  /**
   *
   * @param vehicle
   * @returns
   */
  setNoteStatusToModified(vehicle: Vehicle){
    return this.notesService.setNoteStatusToModified(vehicle);
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
    return this.sortService.sortVehiclesByModelAsc(this.modelFilterService.filterVehiclesModelsDuplicates(this.sortedVehicles));
  }

  /**
   * richiama la funzione per rimuovere i duplicati dalla lista di cantieri
   * @returns funzione nel servizio
   */
  filterVehiclesCantieriDuplicates(){
    return this.sortService.sortVehiclesByCantiereAsc(this.cantieriFilterService.filterVehiclesCantieriDuplicates(this.sortedVehicles));
  }

  /**
   * richiama la funzione per rimuovere i duplicati dalla lista di cantieri
   * @returns funzione nel servizio
   */
  filterFirstEventsDuplicates(){
    return this.sortService.sortVehiclesByFirstEventAsc(this.firstEventsFilterService.filterFirstEventsDuplicates(this.sortedVehicles));
  }

  /**
   * Resetta tutte le selezioni
   */
  resetSelections(){
    const allVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    console.log(allVehicles);
    this.selectService.selectVehicles(allVehicles);
    this.vehicleTableData.data = allVehicles;
    this.selectService.allOptionsSelected = true;
    this.cd.detectChanges();
  }
}

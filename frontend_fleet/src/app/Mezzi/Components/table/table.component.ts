import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, HostListener, inject, NgZone, OnDestroy, signal, ViewChild } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Subject, takeUntil, filter, forkJoin, take, tap, skip, catchError, EMPTY } from 'rxjs';
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
import { CookiesService } from '../../../Common-services/cookies service/cookies.service';
import { User } from '../../../Models/User';
import { NoteSectionComponent } from "../note-section/note-section/note-section.component";
import { MezziFiltersService } from '../../Services/mezzi-filters/mezzi-filters.service';
import { Router } from '@angular/router';

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
    NoteSectionComponent
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
  resetLoading = false;
  loadingProgress: number = 0;
  loadingText: string = "";

  vehicleTableData = new MatTableDataSource<Vehicle>();

  sortedVehicles: Vehicle[] = [];
  expandedVehicle: Vehicle | null = null;

  user!: User;


  displayedColumns: string[] = ["Azienda", "Targa", "Marca&modello", "Cantiere",
  "Anno immatricolazione", "Tipologia attrezzatura", "Allestimento",
  "Data-installazione-fleet", "Data-rimozione-apparato"];
  columnsToDisplayWithExpand = [...this.displayedColumns, "expand"];


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
    private mezziFilterService: MezziFiltersService,
    private router: Router,
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
    //recupero utente da access token
    this.user = this.authService.getParsedAccessToken();
    this.cd.detectChanges();

    //ascolto dei filtri su tabella
    this.mezziFilterService.filterTable$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        this.vehicleTableData.data = [];

        if (vehicles && vehicles.length > 0) {
          this.vehicleTableData.data = vehicles;
        }

        this.vehicleTable.renderRows();
      },
      error: error => console.error("Errore nel filtro della tabella: ", error)
    });

    //riempimento dei dati della tabella
    this.fillTable();
    this.cd.detectChanges();
  }

  /**
   * Esegue il riempimento della tabella
   */
  fillTable(): void {
    this.loadVehicles();
  }

  /**
   * Ricerca tutti i veicoli
   * facendo una chiamata API
   */
  loadVehicles(): void {
    const vehicles$ = this.vehicleApiService.getAllVehicles().pipe(
      tap(() => {
        this.loadingText = "Caricamento dei veicoli...";
        this.loadingProgress += 50;
      }),
      catchError(error => {
        console.error("Error fetching vehicles: ", error);
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    );

    vehicles$.subscribe(vehicles => {
      this.sessionStorageService.setItem("allVehicles", JSON.stringify(vehicles));
      this.sortedVehicles = this.sortService.sortVehiclesByPlateAsc(vehicles) as Vehicle[];
      this.vehicleTableData.data = this.sortedVehicles;
      this.vehicleTable.renderRows();
      this.selectService.selectVehicles(this.sortedVehicles);
      this.loadNotes();
      this.cd.detectChanges();
    });
  }

  /**
   * Ricerca la nota associata a ciuscun veicolo
   * facendo una chiamata API
   */
  loadNotes(): void {
    const notes$ = this.notesService.getAllNotes().pipe(
      tap(() => {
        this.loadingText = "Caricamento delle note...";
        this.loadingProgress += 50;
      }),
      catchError(error => {
        console.error("Error fetching notes: ", error);
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    );

    notes$.subscribe(notes => {
      if (this.sortedVehicles) {
        this.sortedVehicles = this.notesService.mergeVehiclesWithNotes(this.sortedVehicles, notes);
        this.vehicleTableData.data = this.sortedVehicles;
        this.vehicleTable.renderRows();
        this.selectService.selectVehicles(this.sortedVehicles);
        this.cd.detectChanges();
      }
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
   * Controlla l'espansione e la contrazione della sezione commenti di un veicolo.
   * @param vehicle veicolo di cui espandere la riga.
   * @returns Il veicolo attualmente espanso, oppure null se nessun veicolo è espanso.
   */
  checkVehicleExpansion(vehicle: Vehicle) {
    return this.expandedVehicle = this.expandedVehicle === vehicle ? null : vehicle;
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
   * Naviga alla pagina di dettaglio del veicolo
   * @param vehicleId id del veicolo del quale visualizzare il dettaglio
   */
  showVehicleDetail(vehicleId: number){
    this.router.navigate(['/dettaglio-mezzo', vehicleId]);
  }


  /**
   * Resetta tutte le selezioni
   */
  resetSelections(){
    //2 seconds progress bar loading
    this.resetLoading = true;
    this.vehicleTableData.data = [];
    this.cd.detectChanges();
    this.vehicleTable.renderRows();
    setTimeout(() => {
      //recupero di tutte le note dal db
      this.notesService.getAllNotes().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes: Note[]) => {
          const allVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
          const mergedVehicles: Vehicle[] = this.notesService.mergeVehiclesWithNotes(allVehicles, notes);
          this.vehicleTableData.data = mergedVehicles;
          this.selectService.allOptionsSelected = true;
          this.resetLoading = false;
          this.cd.detectChanges();
        },
        error: error => console.error("Errore nel recupero delle note per il reset dei filtri: ", error)
      });
    }, 1000);
  }
}

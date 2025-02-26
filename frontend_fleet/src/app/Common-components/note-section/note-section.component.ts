import { CommonModule } from "@angular/common";
import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, Input, inject, ChangeDetectorRef, ViewEncapsulation } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBarModule, MatSnackBar } from "@angular/material/snack-bar";
import { skip, Subject, takeUntil } from "rxjs";
import { NoteSnackbarComponent } from "../../Mezzi/Components/note-snackbar/note-snackbar.component";
import { NotesService } from "../../Common-services/notes/notes.service";
import { Note } from "../../Models/Note";
import { Vehicle } from "../../Models/Vehicle";
import { User } from "../../Models/User";
import { CookiesService } from "../../Common-services/cookies service/cookies.service";
import { jwtDecode } from "jwt-decode";
import { AuthService } from "../../Common-services/auth/auth.service";

@Component({
  selector: 'app-note-section',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
],
  templateUrl: './note-section.component.html',
  styleUrl: './note-section.component.css',
})
export class NoteSectionComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('noteInput') noteInput!: ElementRef;
  @Input() vehicle!: Vehicle;
  username!: string;

  private snackBar = inject(MatSnackBar);
  createdBtn: boolean = false;
  updatedBtn: boolean = false;
  eliminatedBtn: boolean = false;
  modified: boolean = false;
  error: string = "";

  snackbarDuration = 2; //durata snackbar in secondi

  constructor(
    public notesService: NotesService,
    private cookieService: CookiesService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.refreshOptions();
    setTimeout(() => {
      this.notesService.loadNote$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshOptions();
        },
        error: error => console.error("Errore nell'aggiornamento delle opzioni della nota: ", error)
      });
    });

    const jwt = this.cookieService.getCookie("user");
    const user = this.authService.decodeToken(jwt);
    this.username = user.username;
  }

  refreshOptions(){
    if(this.vehicle.note){
      this.updatedBtn = true;
      this.eliminatedBtn = true;
      this.createdBtn = false;
    }else{
      this.updatedBtn = false;
      this.eliminatedBtn = false;
      this.createdBtn = true;
    }
    this.cd.detectChanges();
  }

  /**
   * Crea una nuova nota associata a un veicolo specificato,
   * facendo apparire la snackbar associata nel caso di successo.
   * @param vehicle L'oggetto Vehicle per cui si sta creando la nota.
   * @param content Il contenuto della nota da creare.
   */
  createNote(vehicle: Vehicle, content: string){
    if(content){
      this.notesService.createNote(vehicle, content).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newNote: Note) => {
          this.vehicle.note = newNote;
          this.vehicle.note = newNote;
          this.modified = false;
          this.updatedBtn = true;
          this.eliminatedBtn = true;
          this.createdBtn = false;
          this.openNoteSnackbar("Nota creata ✔");
          this.cd.detectChanges();
        },
        error: error => console.error("Errore nella creazione della nota: ", error)
      });
    }else{
      this.error = "Impossibile creare una nota senza alcun contenuto.";
      setTimeout(() => {
        this.error = "";
      }, 2000);
      this.cd.detectChanges();
    }
  }

  /**
   * Aggiorna il contenuto di una nota esistente per un veicolo specifico.
   * Se il nuovo contenuto della nota è una stringa vuota, la nota viene eliminata.
   * Fa apparire la snackbar associata in entrambi i casi.
   * @param vehicle L'oggetto Vehicle per cui si sta aggiornando la nota.
   * @param content Il nuovo contenuto della nota. Se vuoto, elimina la nota.
   */
  updateNote(vehicle: Vehicle, content: string){
    if(content){
      if(content && vehicle.note?.content != content){
        this.notesService.updateNote(vehicle, content).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.openNoteSnackbar("Nota aggiornata ✔");
            if(vehicle.note) vehicle.note.updatedAt = new Date().toISOString();
            this.updatedBtn = true;
            this.eliminatedBtn= true;
            this.createdBtn = false;
            this.modified = false;

            this.cd.detectChanges()
          },
          error: error => console.error("Errore nell'aggiornamento della nota: ", error)
        });
      }else{
        this.openNoteSnackbar("Contenuto della nota invariato ⚠");
      }
    }else{
      this.deleteNote(vehicle);
    }
  }

  /**
   * Elimina una nota associata a un veicolo specifico,.
   * facendo apparire la snackbar associata nel caso di successo
   * @param vehicle L'oggetto Vehicle per cui si sta eliminando la nota.
   */
  deleteNote(vehicle: Vehicle){
    this.notesService.deleteNote(vehicle).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.openNoteSnackbar("Nota eliminata ❌");
        this.noteInput.nativeElement.value = "";
        this.createdBtn = true;
        this.updatedBtn = false;
        this.eliminatedBtn= false;
        this.modified = false;
        vehicle.note = null;
        //modifica dell'array di note nel servizio x bottone reset
        // this.notesService.vehicleNotes.map(note => {
        //   if(note.id == )
        // });
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nella cancellazione della nota: ", error)
    });
  }

  /**
   * Richiama la funzione nel servizio noteservice
  */
  isNoteModified(content: string, vehicle: Vehicle){
    this.modified = this.notesService.isNoteModified(content, vehicle);
    this.cd.detectChanges();
  }

  /**
   * Apre la snackbar per la nota
   */
  openNoteSnackbar(content: string): void {
    this.snackBar.openFromComponent(NoteSnackbarComponent, {
      duration: this.snackbarDuration * 1000,
      data: { content: content }
    });
  }
}

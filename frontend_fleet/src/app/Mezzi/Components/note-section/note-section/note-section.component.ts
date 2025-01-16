import { CommonModule } from '@angular/common';
import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { skip, Subject, takeUntil } from 'rxjs';
import { Note } from '../../../../Models/Note';
import { Vehicle } from '../../../../Models/Vehicle';
import { NotesService } from '../../../Services/notes/notes.service';
import { User } from '../../../../Models/User';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoteSnackbarComponent } from '../../note-snackbar/note-snackbar.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-note-section',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './note-section.component.html',
  styleUrl: './note-section.component.css'
})
export class NoteSectionComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('noteInput') noteInput!: ElementRef;
  @Input() vehicle!: Vehicle;
  @Input() user!: User;
  private snackBar = inject(MatSnackBar);
  createdBtn: boolean = false;
  updatedBtn: boolean = false;
  eliminatedBtn: boolean = false;
  modified: boolean = false;
  error: string = "";

  snackbarDuration = 2; //durata snackbar in secondi

  constructor(
    public notesService: NotesService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    if(this.vehicle.note){
      this.updatedBtn = true;
      this.eliminatedBtn = true;
    }else{
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
          this.notesService.vehicleNotes.push(newNote);
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
      this.notesService.updateNote(vehicle, content).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.openNoteSnackbar("Nota aggiornata ✔");
          this.updatedBtn = true;
          this.eliminatedBtn= true;
          this.createdBtn = false;
          this.modified = false;
          //modifica dell'array di note nel servizio x bottone reset
          // this.notesService.vehicleNotes.map(note => {
          //   if(note.id == )
          // });
          this.cd.detectChanges()
        },
        error: error => console.error("Errore nell'aggiornamento della nota: ", error)
      });
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
        this.openNoteSnackbar("Nota eliminata X");
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

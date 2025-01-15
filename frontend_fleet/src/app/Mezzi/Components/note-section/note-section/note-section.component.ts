import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { Note } from '../../../../Models/Note';
import { Vehicle } from '../../../../Models/Vehicle';
import { NotesService } from '../../../Services/notes/notes.service';
import { User } from '../../../../Models/User';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoteSnackbarComponent } from '../../note-snackbar/note-snackbar.component';

@Component({
  selector: 'app-note-section',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './note-section.component.html',
  styleUrl: './note-section.component.css'
})
export class NoteSectionComponent{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @Input() vehicle!: Vehicle;
  @Input() user!: User;
  private snackBar = inject(MatSnackBar);
  snackbarDuration = 2; //durata snackbar in secondi

  constructor(private notesService: NotesService){}

  /**
   * salva una nota nel db
   * @param vehicle veicolo sul quale salvare la nota
   * @param content contenuto della nota
   */
  saveNote(vehicle: Vehicle, content: string){
    //se il veicolo possedeva già una nota creata imposta il salvataggio di quest'ultima a true
    vehicle.note  = {
      id: vehicle.note.id,
      saved: true,
      content: '',
      vehicle: {
        id: vehicle.id,
        veId: vehicle.veId
      },
      user: {
        id: this.user.id,
        username: this.user.username
      },
    }

    const vehicleObj = {
      id: vehicle.id,
      veId: vehicle.veId
    }
    const nota = new Note(content, vehicle.note.id, this.user, vehicleObj);//creazione nuovo oggetto nota

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
   * Apre la snackbar per la nota salvata
   */
  openSavedNoteSnackbar(): void {
    this.snackBar.openFromComponent(NoteSnackbarComponent, {
      duration: this.snackbarDuration * 1000,
    });
  }

  /**
   * Imposta lo stato della nota a modificato
   * @param vehicle veicolo a cui appartiene la nota
   * @returns chiamata al servizio
   */
  setNoteStatusToModified(vehicle: Vehicle){
    return this.notesService.setNoteStatusToModified(vehicle);
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
}

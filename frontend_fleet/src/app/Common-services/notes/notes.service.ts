import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Note } from '../../Models/Note';
import { Observable, Subject, throwError } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';
import { CookieService } from 'ngx-cookie-service';
import { serverUrl } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private readonly _loadNote$: Subject<void> = new Subject<void>();

  private url: string = "notes";

  constructor(
    private cookieService: CookieService,
    private http: HttpClient
  ) { }

  /**
   * Salva una nota nel db
   * @param note oggetto nota da salvare
   * @returns http post
   */
  saveNoteInDB(note: Note): Observable<any>{
    const body = {
      userId: note.user.id,
      vehicleId: note.vehicle.veId,
      content: note.content
    }
    return this.http.post<any>(`${serverUrl}/${this.url}/update`, body);
  }

  /**
    * Crea una nota associata a un veicolo.
   * @param vehicle - Il veicolo a cui associare la nota.
   * @param content - Il contenuto della nota.
   * @returns Un Observable della risposta HTTP.
   */
  createNote(vehicle: Vehicle, content: string): Observable<Note>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    const body = {
      content: content,
      veId: vehicle.veId
    }
    return this.http.post<Note>(`${serverUrl}/${this.url}`, body, {headers});
  }

  /**
  * Aggiorna una nota associata a un veicolo.
  * @param vehicle - Il veicolo a cui la nota è associata.
  * @param content - Il nuovo contenuto della nota.
  * @returns Un Observable della risposta HTTP.
  */
  updateNote(vehicle: Vehicle, content: string): Observable<any> {
    if (!vehicle.note || !vehicle.note.id) {
      return throwError(() => new Error('No note associated with this vehicle.'));
    }

    const noteId = vehicle.note.id;
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = { content };

    return this.http.put(`${serverUrl}/${this.url}/${noteId}`, body, { headers });
  }

  /**
  * Elimina una nota associata a un veicolo.
  * @param vehicle - Il veicolo a cui la nota è associata.
  * @returns Un Observable della risposta HTTP.
  */
  deleteNote(vehicle: Vehicle): Observable<any> {
    if (!vehicle.note || !vehicle.note.id) {
      return throwError(() => new Error('No note associated with this vehicle to delete.'));
    }

    const noteId = vehicle.note.id;
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete(`${serverUrl}/${this.url}/${noteId}`, { headers });
  }

  /**
  * Recupera tutte le note.
  * @returns observable
  */
  getAllNotes(): Observable<Note[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<Note[]>(`${serverUrl}/${this.url}`, { headers });
  }

  getNoteByVeId(veId: number): Observable<Note>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    const body = {
      veId: veId
    }
    return this.http.post<Note>(`${serverUrl}/${this.url}/veId`, body, {headers});
  }

  /**
   * Accorpa i veicoli alla propria nota corrispondente
   * @param vehiclesData array di dati dei veicoli
   * @param notes array di note
   * @returns array di veicoli accorpato con le note
   */
  mergeVehiclesWithNotes(vehicles: Vehicle[], notes: Note[] | Note): Vehicle[] {
    const notesArray = Array.isArray(notes) ? notes : [notes]; // Rende sempre un array anche se la nota è singola

    // Accorpamento delle note nei veicoli
    vehicles.forEach((v) => {
      notesArray.forEach(note => {
        if (note && note.vehicle.veId === v.veId) {
          v.note = note; // Associa la nota al veicolo corrispondente
        }
      });
    });
    return vehicles;
  }


  /**
   * controlla se una nota è stata modificata in base al valore iniziale
   * @param currentContent contenuto attuale all'interno del campo di inserimento
   * @param vehicle veicolo da cui prendere il valore della nota salvato in precedenza
   * @returns true se la nota è stata modificata,
   * @returns false se la nota non è stata modificata
   */
  isNoteModified(currentContent: string, vehicle: Vehicle): boolean{
    const note: Note | null = vehicle.note;
    if(note){
      if(note.content == currentContent){
        return false;
      }else{
        return true;
      }
    }else{
      return true;
    }
  }

  public get loadNote$(): Subject<void> {
    return this._loadNote$;
  }
}

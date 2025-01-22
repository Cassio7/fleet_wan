import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Note } from '../../../Models/Note';
import { CommonService } from '../../../Common-services/common service/common.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { BehaviorSubject, firstValueFrom, Observable, throwError } from 'rxjs';
import { VehicleData } from '../../../Models/VehicleData';
import { Vehicle } from '../../../Models/Vehicle';
import { CookiesService } from '../../../Common-services/cookies service/cookies.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  constructor(
    private cookieService: CookiesService,
    private commonService: CommonService,
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
    return this.http.post<any>(`${this.commonService.url}/notes/update`, body);
  }

  /**
    * Crea una nota associata a un veicolo.
   * @param vehicle - Il veicolo a cui associare la nota.
   * @param content - Il contenuto della nota.
   * @returns Un Observable della risposta HTTP.
   */
  createNote(vehicle: Vehicle, content: string): Observable<Note>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    const body = {
      content: content,
      veId: vehicle.veId
    }
    return this.http.post<Note>(`${this.commonService.url}/notes`, body, {headers});
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
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = { content };

    return this.http.put(`${this.commonService.url}/notes/${noteId}`, body, { headers });
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
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete(`${this.commonService.url}/notes/${noteId}`, { headers });
  }

  /**
  * Recupera tutte le note.
  * @returns observable
  */
  getAllNotes(): Observable<Note[]>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<Note[]>(`${this.commonService.url}/notes`, { headers });
  }

  getNoteByVeId(veId: number): Observable<Note>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    const body = {
      veId: veId
    }
    return this.http.post<Note>(`${this.commonService.url}/notes/veId`, body, {headers});
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
}

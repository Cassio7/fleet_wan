import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Note } from '../../../Models/Note';
import { CommonService } from '../../../Common-services/common service/common.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  constructor(
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
      userId: note.userId,
      vehicleId: note.vehicle.veId,
      content: note.content
    }
    return this.http.post<any>(`${this.commonService.url}/notes/update`, body);
  }

  getAllNotes(): Observable<any>{
    return this.http.get<any>(`${this.commonService.url}/notes/all`);
  }
}

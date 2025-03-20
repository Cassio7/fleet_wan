import { Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { WorkSite } from '../../../Models/Worksite';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonService } from '../../../Common-services/common service/common.service';
import { CookieService } from 'ngx-cookie-service';
import { Group } from '../../../Models/Group';
import { User } from '../../../Models/User';

@Injectable({
  providedIn: 'root'
})
export class GestioneCantieriService {
  cantieriFilter: WritableSignal<String[]> = signal([]);

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookieService
  ) { }

  getAllGroups(): Observable<Group[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<Group[]>(`${this.commonService.url}/groups`, {headers});
  }

  getAllWorksite(): Observable<WorkSite[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<WorkSite[]>(`${this.commonService.url}/worksites`, {headers});
  }

  createCantiere(newWorksiteData: {name: string, groupId?: number}): Observable<{message: string, worksite: WorkSite}> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    console.log('cantiere da create: ', newWorksiteData);
    return this.http.post<{message: string, worksite: WorkSite}>(`${this.commonService.url}/worksites`, newWorksiteData, {headers});
  }

  getGroupIdByName(groupName: string): Observable<number | null> {
    return this.getAllGroups().pipe(
      map((groups: Group[]) => {
        const group = groups.find(g => g.name === groupName);
        return group ? group.id : null; // Ritorna l'id se il gruppo è trovato, altrimenti null
      }),
      catchError(error => {
        console.error("Errore nella ricerca di tutti i gruppi: ", error);
        return of(null); // Ritorna null in caso di errore
      })
    );
  }

  deleteWorksiteById(id: number){
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete<WorkSite[]>(`${this.commonService.url}/worksites/${id}`, {headers})
  }
}

import { WorksiteHistory } from './../../Models/Worksite-history';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { WorkSite } from '../../Models/Worksite';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonService } from '../common service/common.service';
import { CookieService } from 'ngx-cookie-service';
import { Group } from '../../Models/Group';

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

  /**
   * Permette di ottenere tutti i gruppi
   * @returns observable http get
   */
  getAllGroups(): Observable<Group[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<Group[]>(`${this.commonService.url}/groups`, {headers});
  }

  /**
   * Permette di ottenere tutti i cantieri per admin
   * @returns observable http get
   */
  getAllWorksite(): Observable<WorkSite[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<WorkSite[]>(`${this.commonService.url}/worksites`, {headers});
  }

  /**
   * Recupera tutti i cantieri associati all'utente che fa la richiesta
   * @returns
   */
  getAllWorksiteMe(): Observable<WorkSite[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<WorkSite[]>(`${this.commonService.url}/worksites/me`, {headers});
  }

  /**
   * Permette di creare un cantiere
   * @param newWorksiteData nuovi dati del cantiere
   * @returns observable http post
   */
  createCantiere(newWorksiteData: {name: string, groupId?: number}): Observable<{message: string, worksite: WorkSite}> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    console.log('cantiere da create: ', newWorksiteData);
    return this.http.post<{message: string, worksite: WorkSite}>(`${this.commonService.url}/worksites`, newWorksiteData, {headers});
  }

  /**
   * Permette di ottenere, tramite una chiamata API a tutti i gruppi, di ottenere l'id  di un gruppo tramite il nome
   * @param groupName nome del gruppo di cui cercare l'id
   * @returns observable http get
   */
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

  /**
   * Ottiene un cantiere tramite il suo id
   * @param id id del cantiere da ottenere
   * @returns observable http get
   */
  getWorksiteById(id: number): Observable<WorkSite>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<WorkSite>(`${this.commonService.url}/worksites/${id}`, {headers});
  }

  /**
   * Permette di spostare un veicolo non assegnato a nessun cantiere in un cantiere
   * @param veId veId del veicolo da spostare
   * @param worksiteId id del cantiere su cui spostare il veicolo
   * @param dateFrom data di spostamento del veicolo
   * @param comment commento opzionale sullo spostamento
   * @returns observable http post
   */
  moveVehicleInWorksite(veId: number, worksiteId: number, dateFrom: string, comment?: string): Observable<{worksiteHistory: WorksiteHistory, message: string}>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      veId: veId,
      worksiteId: worksiteId,
      dateFrom: dateFrom,
      comment: comment
    }

    return this.http.post<{worksiteHistory: WorksiteHistory, message: string}>(`${this.commonService.url}/worksitehistory`, body, {headers});
  }

  freeVehicle(veId: number, dateFrom: string, comment?: string){
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      veId: veId,
      worksiteId: -1,
      dateFrom: dateFrom,
      comment: comment
    }

    return this.http.post<{message: string}>(`${this.commonService.url}/worksitehistory`, body, {headers});
  }

  /**
   * Ottiene un cantiere tramite il suo id
   * @param id id del cantiere da modificare
   * @param worksiteName nome in cui modificare il cantiere
   * @param worksiteGroupId id del gruppo sulla quale si vuole impostare il cantiere
   * @returns observable http put
   */
  updateWorksiteById(id: number, worksiteName: string, worksiteGroupId: number): Observable<WorkSite>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      name: worksiteName,
      groupId: worksiteGroupId
    }

    return this.http.put<WorkSite>(`${this.commonService.url}/worksites/${id}`, body, {headers});
  }

  /**
   * Elimina un cantiere tramite il suo id
   * @param id id del cantiere da eliminare
   * @returns observable http delete
   */
  deleteWorksiteById(id: number): Observable<WorkSite>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete<WorkSite>(`${this.commonService.url}/worksites/${id}`, {headers});
  }
}

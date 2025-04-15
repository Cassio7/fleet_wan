import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../../Models/User';
import { CookieService } from 'ngx-cookie-service';
import { serverUrl } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService{
  private readonly _updateUserData$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor(
    private cookieService: CookieService,
    private http: HttpClient
  ) { }

  /**
   * Controlla se i valori nel form per modificare le informazioni (a parte la password) del proprio profilo sono uguali a
   * quelle precedentemente salvate
   * @param user utente che contiene le informazioni già salvate
   * @param updatedProfileInfo oggetto EditableProfileInfo che contiene le nuove informazioni che si vogliono salvare
   * @returns true se tutti i valori (a parte la password) sono uguali a quelli salvati
   * @returns false se almeno uno dei valori (a parte la password) è diverso
   */
  checkSameValues(user: User, updatedProfileInfo: any): boolean {
    return user.email == updatedProfileInfo.email && user.name == updatedProfileInfo.name && updatedProfileInfo.surname == updatedProfileInfo.surname;
  }


  /**
   * Salva i cambiamenti effettuati al profilo
   * @param updatedProfileInfo informazioni del profilo aggiornate
   * @returns observable http put
   */
  saveChanges(updatedProfileInfo: any): Observable<User>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<User>(`${serverUrl}/users/me`, updatedProfileInfo, {headers});
  }

  public get updateUserData$(): BehaviorSubject<User | null> {
    return this._updateUserData$;
  }
}

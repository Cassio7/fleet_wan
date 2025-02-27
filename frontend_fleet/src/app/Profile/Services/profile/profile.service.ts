import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from '../../../Common-services/common service/common.service';
import { Observable } from 'rxjs';
import { CookiesService } from '../../../Common-services/cookies service/cookies.service';
import { User } from '../../../Models/User';

export interface EditableProfileInfo {
  email: string,
  name: string,
  surname: string,
  currentPassword: string,
  password: string,
  passwordConfirmation: string
}
@Injectable({
  providedIn: 'root'
})
export class ProfileService{

  constructor(
    private commonService: CommonService,
    private cookieService: CookiesService,
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
  checkSameValues(user: User, updatedProfileInfo: EditableProfileInfo): boolean {
    return user.email == updatedProfileInfo.email && user.name == updatedProfileInfo.name && updatedProfileInfo.surname == updatedProfileInfo.surname;
  }



  saveChanges(updatedProfileInfo: EditableProfileInfo): Observable<EditableProfileInfo>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<EditableProfileInfo>(`${this.commonService.url}/users/me`, updatedProfileInfo, {headers});
  }
}

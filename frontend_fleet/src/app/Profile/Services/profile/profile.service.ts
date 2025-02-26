import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from '../../../Common-services/common service/common.service';
import { Observable } from 'rxjs';
import { CookiesService } from '../../../Common-services/cookies service/cookies.service';
import { User } from '../../../Models/User';

export interface EditableProfileInfo {
  email: string | null,
  name: string | null,
  surname: string | null,
  currentPassword: string,
  newPassword: string,
  newPasswordConfirmation: string
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

  checkSameValues(user: User, updatedProfileInfo: EditableProfileInfo): boolean {
    return (Object.keys(updatedProfileInfo) as Array<keyof EditableProfileInfo>)
      .filter((key) => key in user)
      .every((key) => user[key as keyof User] === updatedProfileInfo[key]);
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

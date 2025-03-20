import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { User } from '../../Models/User';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonService } from '../common service/common.service';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private commonService: CommonService,
    private cookieService: CookieService,
    private http: HttpClient
  ) { }

  /**
   * Decodifica un token JWT
   * @param token token JWT da decodificare
   * @returns token decodificato
   */
  decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Errore durante la decodifica del token:', error);
      return null;
    }
  }

  /**
   * Permette di ottenere le informazioni dell'utente attuale
   * @returns observable http get
   */
  getUserInfo(): Observable<User>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });


    return this.http.get<User>(`${this.commonService.url}/users/me`, {headers});
  }

  /**
   * Permette solo all'Admin di prendere le informazioni di un utente tramite il suo id
   * @param id id dell'utente di cui prendere le informazioni
   * @returns observable http get
   */
  getUserInfoById(id: number): Observable<User>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });


    return this.http.get<User>(`${this.commonService.url}/users/${id}`, {headers});
  }

  /**
   * Permette solo all'Admin di modificare le informazioni di un altro utente tramite il suo id
   * @param id id dell'utente di cui modificare le informazioni
   * @param updatedInfo informazioni aggiornate da applicare a i dati salvati dell'utente
   * @returns observable http put
   */
  updateUserInfoById(id: number, updatedInfo: any): Observable<{user: User, message: string}>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      username: updatedInfo.username,
      email: updatedInfo.email,
      name: updatedInfo.name,
      surname: updatedInfo.surname,
      active: updatedInfo.active,
      password: updatedInfo.password,
      role: updatedInfo.role
    }

    console.log('requesting for body: ', body);


    return this.http.put<{message: string, user: User}>(`${this.commonService.url}/users/${id}`, body, {headers});
  }

  /**
   * Permette di ottenere le informazioni di tutti gli utenti
   * @returns observable http get
   */
  getAllUser(): Observable<User[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<User[]>(`${this.commonService.url}/users`, {headers});
  }


  createUser(user: User): Observable<{message: string, user: User}>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const { email, name, surname, username, password, role } = user;

    const body = {
      email,
      name,
      surname,
      username,
      password,
      role
    };

    return this.http.post<{message: string, user: User}>(`${this.commonService.url}/users`, body, {headers});
  }


  /**
   * Decodifica il token d'accesso con le informazioni dell'utente
   * @returns l'oggetto contenente le informazioni dell'utente
   */
  getParsedAccessToken(): User{
    const access_token = this.cookieService.get("user");
    return this.decodeToken(access_token);
  }
}

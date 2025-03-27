import { Injectable } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { DashboardComponent } from '../../Dashboard/Components/dashboard/dashboard.component';
import { AuthService } from '../auth/auth.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(
    private cookieService: CookieService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Funzione che controlla se l'utente ha eseguito l'accesso e gli è stato fornito un access token
   * @returns true
   */
  canActivate(): boolean {
    const token = this.cookieService.get('user');
    if (token) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }

}

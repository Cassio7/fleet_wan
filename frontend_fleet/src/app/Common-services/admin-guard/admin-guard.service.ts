import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuardService {
  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Funzione che controlla se l'utente ha eseguito l'accesso e gli è stato fornito un access token
   * @returns true
   */
  canActivate(): boolean {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    }
    this.router.navigate(['/404-NotFound']);
    return false;
  }
}

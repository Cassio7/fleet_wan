import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  constructor(private authService: AuthService) {}

  /**
   * Funzione che controlla se l'utente ha eseguito l'accesso e gli è stato fornito un access token
   * @returns true
   */
  canActivate(): boolean {
    return this.authService.isAuthenticated();
  }
}

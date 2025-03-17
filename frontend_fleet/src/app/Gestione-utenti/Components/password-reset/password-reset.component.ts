import { CommonModule } from '@angular/common';
import { Component, inject, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { User } from '../../../Models/User';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})
export class PasswordResetComponent {
  private readonly destroy$: Subject<void> = new Subject<void>();

  private snackBar: MatSnackBar = inject(MatSnackBar);

  @Input() userId!: number;

  passwordForm: FormGroup;
  errorText: string = "";
  isSaveable: boolean = false;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private authService: AuthService
  ) {
    this.passwordForm = new FormGroup({
      newPassword: new FormControl(''),
      passwordConfirmation: new FormControl('')
    });
  }

  updatePassword(){
    const newPassword = this.passwordForm.get("newPassword")?.value;
    const passwordConfirmation = this.passwordForm.get("passwordConfirmation")?.value;

    console.log('parameters to the fnct: ', this.userId, {password: newPassword});
    if(newPassword == passwordConfirmation){
      this.authService.updateUserInfoById(this.userId, {password: newPassword}).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: {user: User, message: string}) => {
          this.isSaveable = false;
          this.openSnackbar("Password salvata con successo!");
        },
        error: error => {
          console.error("Errore nell'aggiornamento delle informazioni dell'utente: ", error);
          this.errorText = "Errore nel salvataggio";
        }
      });
    }else{
      this.errorText = "Le due password non sono uguali";
    }
  }

  checkSaveable(){
    const newPassword = this.passwordForm.get("newPassword")?.value;
    const passwordConfirmation = this.passwordForm.get("passwordConfirmation")?.value;

    if(passwordConfirmation && !newPassword){
      this.errorText = "Inserire la password attuale";
      this.isSaveable = false;
    }else if(newPassword && !passwordConfirmation){
      this.errorText = "Inserire la conferma della nuova password";
      this.isSaveable = false;
    }else if(newPassword !== passwordConfirmation){
      this.errorText = "Le password non sono uguali";
      this.isSaveable = false;
    }else{
      this.errorText = "";
      this.isSaveable = true;
    }
  }
  /**
   * Apre la snackbar per la conferma di salvataggio dei cambiamenti
   */
  openSnackbar(content: string): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      duration: 2 * 1000,
      data: { content: content }
    });
  }
}

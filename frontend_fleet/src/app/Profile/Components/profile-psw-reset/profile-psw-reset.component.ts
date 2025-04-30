import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../Models/User';
import { openSnackbar } from '../../../Utils/snackbar';
import { ProfileService } from '../../Services/profile/profile.service';

@Component({
  selector: 'app-profile-psw-reset',
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
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './profile-psw-reset.component.html',
  styleUrl: './profile-psw-reset.component.css'
})
export class ProfilePswResetComponent {
private readonly destroy$: Subject<void> = new Subject<void>();

  private snackBar: MatSnackBar = inject(MatSnackBar);

  @Input() userId!: number;

  passwordForm: FormGroup;
  errorText: string = "";
  isSaveable: boolean = false;

  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showPasswordConfirmation: boolean = false;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private profileService: ProfileService
  ) {
    this.passwordForm = new FormGroup({
      currentPassword: new FormControl(''),
      newPassword: new FormControl(''),
      passwordConfirmation: new FormControl('')
    });
  }

  updatePassword(){
    const currentPassword = this.passwordForm.get("currentPassword")?.value;
    const newPassword = this.passwordForm.get("newPassword")?.value;
    const passwordConfirmation = this.passwordForm.get("passwordConfirmation")?.value;

    console.log('parameters to the fnct: ', this.userId, {password: newPassword});
    if(newPassword == passwordConfirmation){
      this.profileService.saveChanges({
        currentPassword: currentPassword,
        password: newPassword
      }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.isSaveable = false;
          openSnackbar(this.snackBar, "Password salvata con successo!");
          this.passwordForm.reset();
        },
        error: error => {
          console.error("Errore nell'aggiornamento delle informazioni dell'utente: ", error);
          this.errorText = error.error.message;
        }
      });
    }else{
      this.errorText = "Le due password non sono uguali";
    }
  }

  checkSaveable(){
    const currentPassword = this.passwordForm.get("currentPassword")?.value;
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
    }else if(newPassword && passwordConfirmation && !currentPassword){
      this.errorText = "Inserire la password attuale";
      this.isSaveable = false;
    }else{
      this.errorText = "";
      this.isSaveable = true;
    }
  }

}

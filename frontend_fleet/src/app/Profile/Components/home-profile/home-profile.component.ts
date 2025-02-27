import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { EditableProfileInfo, ProfileService } from '../../Services/profile/profile.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { User } from '../../../Models/User';

@Component({
  selector: 'app-home-profile',
  templateUrl: './home-profile.component.html',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  styleUrls: ['./home-profile.component.css'],
  standalone: true
})
export class HomeProfileComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  isEditMode: boolean = false;
  user!: User;

  updatedProfileInfo!: EditableProfileInfo;
  saveable: boolean = false;

  errorText: string = "";

  showPassword: boolean = false;
  showNewPassword: boolean = false;
  showNewPasswordConfirmation: boolean = false;

  isSaveable: boolean = false;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.authService.getUserInfo().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          console.log("fetched user: ", user);
          this.user = user;

          this.setEditableProfileInfo();
        },
        error: error => console.error("Errore nel recupero delle informazioni dell'utente: ", error)
      });
  }

  checkSaveable(){
    if(this.profileService.checkSameValues(this.user, this.updatedProfileInfo)){
      this.isSaveable = false;
    }else{
      this.isSaveable = true;
    }

    const { currentPassword, password } = this.updatedProfileInfo;
    const passwordInput = currentPassword !== "";

    if(passwordInput && currentPassword != password && this.checkPasswordEquality()){
      this.isSaveable = true;
    }else{
      this.isSaveable = false;
    }
  }


  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.setEditableProfileInfo();
    }
  }

  saveChanges() {
    const password = this.updatedProfileInfo.password;
    const passwordConfirmation = this.updatedProfileInfo.passwordConfirmation;
    if(password == passwordConfirmation){
      this.profileService.saveChanges(this.updatedProfileInfo).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log("Changes saved successfully!");
          this.isEditMode = false;
          this.isSaveable = false;
        },
        error: error => {
          console.error("Errore nel salvataggio dei cambiamenti del profilo: ", error);
          this.errorText = error?.error?.message || "Errore sconosciuto";
        }


      });
    }
  }

  /**
   * Controlla se la nuova password e la conferma della nuova password sono uguali
   * controllando se la vecchia password è stata inserita
   * @returns true se va tutto bene
   * @returns false se per qualche motivo non va bene
   */
  checkPasswordEquality(): boolean {
    const { currentPassword, password, passwordConfirmation } = this.updatedProfileInfo;

    // Verifica se i campi delle nuove password sono stati compilati
    const arePasswordFieldsFilled = password !== "" && passwordConfirmation !== "";

    // Verifica se le nuove password corrispondono
    const doPasswordsMatch = password === passwordConfirmation;

    // Verifica se la password attuale è vuota
    const isCurrentPasswordEmpty = !currentPassword || currentPassword.trim() === "";

    // Verifica se la password corrente è uguale alla nuova
    const isCurrentEqualToNew = currentPassword === password && currentPassword !== "";

    if(!this.profileService.checkSameValues(this.user, this.updatedProfileInfo) && !isCurrentPasswordEmpty){
      return true;
    }



    // Controlli in sequenza

    if (isCurrentPasswordEmpty) {
      this.errorText = "Inserisci la password attuale.";
      return false;
    }

    if (!arePasswordFieldsFilled) {
      this.errorText = "Compila entrambi i campi della nuova password.";
      return false;
    }

    if (!doPasswordsMatch) {
      this.errorText = "Le nuove password non corrispondono.";
      return false;
    }

    if (isCurrentEqualToNew) {
      this.errorText = "La nuova password deve essere diversa da quella attuale.";
      return false;
    }

    // Tutto è corretto
    this.errorText = "";
    return true;
  }

  cancelEdit() {
    this.isEditMode = false;

    this.setEditableProfileInfo();
  }

  setEditableProfileInfo(){
    this.updatedProfileInfo = {
      email: this.user.email,
      name: this.user.name,
      surname: this.user.surname,
      currentPassword: "",
      password: "",
      passwordConfirmation: ""
    };
  }
}

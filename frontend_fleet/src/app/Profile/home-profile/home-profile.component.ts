import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../Common-services/auth/auth.service';
import { EditableProfileInfo, ProfileService } from '../Services/profile/profile.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { User } from '../../Models/User';

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

  passwordConfirmationError: string = "";

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

  isSaveable(): boolean {
    return this.profileService.checkSameValues(this.user, this.updatedProfileInfo);
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.setEditableProfileInfo();
    }
  }

  saveChanges() {
    const newPassword = this.updatedProfileInfo.newPassword;
    const newPasswordConfirmation = this.updatedProfileInfo.newPasswordConfirmation;
    if(newPassword == newPasswordConfirmation){
      this.profileService.saveChanges(this.updatedProfileInfo).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log("Changes saved successfully!");
          this.isEditMode = false;
        },
        error: error => console.error("Errore nel salvataggio dei cambiamenti del profilo: ", error)
      });
    }
  }

  checkNewPasswordEquality(){
    const newPassword = this.updatedProfileInfo.newPassword;
    const newPasswordConfirmation = this.updatedProfileInfo.newPasswordConfirmation;
    if(newPassword == newPasswordConfirmation){
      this.passwordConfirmationError = "Le password non sono uguali!";
    }else{
      this.passwordConfirmationError = "";
    }
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
      newPassword: "",
      newPasswordConfirmation: ""
    };
  }
}

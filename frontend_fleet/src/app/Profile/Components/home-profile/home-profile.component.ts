import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';

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
    MatSnackBarModule,
    MatIconModule
  ],
  styleUrls: ['./home-profile.component.css'],
  standalone: true
})
export class HomeProfileComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  private snackBar = inject(MatSnackBar);

  isEditMode: boolean = false;
  user!: User;

  snackbarDuration: number = 2;

  profileForm!: FormGroup;
  errorText: string = "";

  showPassword: boolean = false;
  showNewPassword: boolean = false;
  showNewPasswordConfirmation: boolean = false;

  isSaveable: boolean = false;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService
  ) {
    this.initForm();
  }

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
          this.initForm();
        },
        error: error => console.error("Errore nel recupero delle informazioni dell'utente: ", error)
      });
  }

  initForm(): void {
    this.profileForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      name: new FormControl('', [Validators.required]),
      surname: new FormControl('', [Validators.required]),
      currentPassword: new FormControl(''),
      password: new FormControl(''),
      passwordConfirmation: new FormControl('')
    });

    if (this.user) {
      this.profileForm.patchValue({
        email: this.user.email,
        name: this.user.name,
        surname: this.user.surname
      });
    }

    this.profileForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkSaveable();
      this.updateErrorMessage();
    });
  }

  checkSaveable(): void {
    const formValues = this.profileForm.value;

    const isProfileChanged =
      this.user && (
        this.user.email !== formValues.email ||
        this.user.name !== formValues.name ||
        this.user.surname !== formValues.surname
      );

    const isPasswordChanged =
      formValues.password !== "" &&
      formValues.passwordConfirmation !== "" &&
      formValues.password === formValues.passwordConfirmation &&
      formValues.currentPassword !== formValues.password;

    this.isSaveable = (isProfileChanged || isPasswordChanged) && this.profileForm.valid;
  }

  updateErrorMessage(): void {
    const formValues = this.profileForm.value;
    const { currentPassword, password, passwordConfirmation } = formValues;

    const isProfileChanged =
      this.user && (
        this.user.email !== formValues.email ||
        this.user.name !== formValues.name ||
        this.user.surname !== formValues.surname
      );

    // Caso 1: Campi del profilo modificati ma password corrente non inserita
    if (isProfileChanged && (!currentPassword || currentPassword.trim() === "")) {
      this.errorText = "Inserisci la password attuale per salvare le modifiche.";
      return;
    }

    // Caso 2: Nuova password inserita ma conferma mancante
    if (password && (!passwordConfirmation || passwordConfirmation.trim() === "")) {
      this.errorText = "Inserisci la conferma della nuova password.";
      return;
    }

    // Caso 3: Conferma password inserita ma nuova password mancante
    if (passwordConfirmation && (!password || password.trim() === "")) {
      this.errorText = "Inserisci la nuova password.";
      return;
    }

    // Caso 4: Entrambi i campi di password compilati ma non corrispondono
    if (password && passwordConfirmation && password !== passwordConfirmation) {
      this.errorText = "Le password sono diverse.";
      return;
    }

    // Caso 5: Nuova password uguale alla password corrente
    if (password && currentPassword && password === currentPassword) {
      this.errorText = "La nuova password deve essere diversa da quella attuale.";
      return;
    }

    // Nessun errore
    this.errorText = "";
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.initForm();
    }
  }

  saveChanges(): void {
    this.updateErrorMessage();

    if (this.profileForm.valid && this.isSaveable && !this.errorText) {
      const formValues = this.profileForm.value;

      const updatedProfileInfo: EditableProfileInfo = {
        email: formValues.email,
        name: formValues.name,
        surname: formValues.surname,
        currentPassword: formValues.currentPassword,
        password: formValues.password,
        passwordConfirmation: formValues.passwordConfirmation
      };

      this.profileService.saveChanges(updatedProfileInfo).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log("Changes saved successfully!");
          this.isEditMode = false;
          this.isSaveable = false;
          this.openNoteSnackbar("Cambiamenti salvati con successo!");
        },
        error: error => {
          console.error("Errore nel salvataggio dei cambiamenti del profilo: ", error);
          this.errorText = error?.error?.message || "Errore sconosciuto";
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.errorText = "";
    this.initForm();
  }

  /**
   * Apre la snackbar per la nota
   */
  openNoteSnackbar(content: string): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      duration: this.snackbarDuration * 1000,
      data: { content: content }
    });
  }
}

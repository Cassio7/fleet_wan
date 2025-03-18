import { state } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Inject, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../Models/User';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-dati-utente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './dati-utente.component.html',
  styleUrl: './dati-utente.component.css'
})
export class DatiUtenteComponent implements OnDestroy, AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  userForm: FormGroup;
  @Input() user!: User;

  errorText: string = "";
  isSaveable: boolean = false;

  snackBar: MatSnackBar = inject(MatSnackBar);


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private authService: AuthService
  ) {
    this.userForm = new FormGroup({
      name: new FormControl(''),
      surname: new FormControl(''),
      username: new FormControl(''),
      email: new FormControl('', Validators.email),
      state: new FormControl(''),
      role: new FormControl('',)
    });
  }

  ngAfterViewInit(): void {
    if(this.user){
      this.initForm();
    }
  }


  initForm(): void {
    if (this.user) {
      this.userForm.patchValue({
        name: this.user.name,
        surname: this.user.surname,
        username: this.user.username,
        email: this.user.email,
        state: this.user.active ? "Attivo" : "Sospeso",
        role: this.user.role
      });
    }
  }

  updateData(){
    console.log('CHIAMTA UPDATE DATA!');
    const formValues = this.userForm.value;

    console.log('formValues: ', formValues);

    const updatedProfileInfo: any = {
      username: formValues.username,
      email: formValues.email,
      name: formValues.name,
      surname: formValues.surname,
      active: formValues.state == "Attivo" ? true : false,
      password: "",
      role: formValues.role
    };

    this.authService.updateUserInfoById(this.user.id, updatedProfileInfo).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: {user: User, message: string}) => {
        console.log("Changes saved successfully!");
        this.isSaveable = false;
        this.user = response.user;
        this.openSnackbar("Cambiamenti salvati con successo!");
        // this.profileService.updateUserData$.next()
      },
      error: error => {
        console.error("Errore nel salvataggio dei cambiamenti del profilo: ", error);
        this.errorText = error?.error?.message || "Errore sconosciuto";
      }
    });
  }

  checkSaveable() {
    const stateValue = this.userForm.get("state")?.value === "Attivo"; // Converte in booleano

    this.isSaveable =
      this.user.name !== this.userForm.get("name")?.value ||
      this.user.surname !== this.userForm.get("surname")?.value ||
      this.user.username !== this.userForm.get("username")?.value ||
      this.user.email !== this.userForm.get("email")?.value ||
      this.user.active !== stateValue ||  // Ora confronta due booleani
      this.user.role !== this.userForm.get("role")?.value;
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

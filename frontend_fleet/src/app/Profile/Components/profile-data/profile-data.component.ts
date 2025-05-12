import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../Models/User';
import { openSnackbar } from '../../../Utils/snackbar';
import { ProfileService } from '../../Services/profile/profile.service';

@Component({
  selector: 'app-profile-data',
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
  templateUrl: './profile-data.component.html',
  styleUrl: './profile-data.component.css'
})
export class ProfileDataComponent {
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
    private profileService: ProfileService
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

    this.userForm.get('username')?.disable();
    this.userForm.get('state')?.disable();
    this.userForm.get('role')?.disable();
  }

  updateData(){
    const formValues = this.userForm.value;


    const updatedProfileInfo: any = {
      username: formValues.username,
      email: formValues.email,
      name: formValues.name,
      surname: formValues.surname,
      active: formValues.state == "Attivo" ? true : false,
      password: "",
      role: formValues.role
    };


    this.profileService.saveChanges(updatedProfileInfo).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: User) => {
        this.isSaveable = false;
        this.user = user;
        openSnackbar(this.snackBar, "Cambiamenti salvati con successo!");
        // this.profileService.updateUserData$.next()
      },
      error: error => {
        console.error("Errore nel salvataggio dei cambiamenti del profilo: ", error);
        this.errorText = error?.error?.message || "Errore sconosciuto";
      }
    });
  }

  checkSaveable() {
    const stateValue = this.userForm.get("state")?.value === "Attivo";

    this.isSaveable =
      this.user.name !== this.userForm.get("name")?.value ||
      this.user.surname !== this.userForm.get("surname")?.value ||
      this.user.username !== this.userForm.get("username")?.value ||
      this.user.email !== this.userForm.get("email")?.value ||
      this.user.active !== stateValue ||
      this.user.role !== this.userForm.get("role")?.value;
  }
}

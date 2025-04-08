import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogContent, MatDialogActions, MatDialogClose, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HomeGestioneCantieriComponent } from '../../../../Gestione-cantieri/Components/home-gestione-cantieri/home-gestione-cantieri.component';

@Component({
  selector: 'app-societa-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle
  ],
  templateUrl: './societa-create-dialog.component.html',
  styleUrl: './societa-create-dialog.component.css'
})
export class SocietaCreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<HomeGestioneCantieriComponent>);
  createCompanyForm: FormGroup;

  constructor() {
    this.createCompanyForm = new FormGroup({
      suId: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
      name: new FormControl('', Validators.required),
    });
  }

  onConfirm() {
    // Mark all fields as touched to trigger validation display
    Object.keys(this.createCompanyForm.controls).forEach(key => {
      const control = this.createCompanyForm.get(key);
      control?.markAsTouched();
    });

    if (this.createCompanyForm.valid) {
      this.dialogRef.close(this.createCompanyForm.value);
    }
  }
}

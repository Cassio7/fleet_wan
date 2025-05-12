import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MY_DATE_FORMATS } from '../../../Utils/date-format';
import { HomeCantiereEditComponent } from '../home-cantiere-edit/home-cantiere-edit.component';

@Component({
  selector: 'app-move-cantiere-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'it-IT' }
  ],
  templateUrl: './move-cantiere-dialog.component.html',
  styleUrl: './move-cantiere-dialog.component.css'
})
export class MoveCantiereDialogComponent {
  readonly dialogRef = inject(MatDialogRef<HomeCantiereEditComponent>);

  moveCantiereForm: FormGroup;

  constructor(){
    this.moveCantiereForm = new FormGroup({
      dateFrom: new FormControl('', Validators.required),
      comment: new FormControl(''),
    });
  }

  onConfirm(){
    const body = {
      dateFrom: this.moveCantiereForm.get('dateFrom')?.value.toString(),
      comment: this.moveCantiereForm.get('comment')?.value,
    };

    this.dialogRef.close(body);
  }
}

import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Group } from '../../../Models/Group';
import { WorkSite } from '../../../Models/Worksite';
import { HomeGestioneCantieriComponent } from '../home-gestione-cantieri/home-gestione-cantieri.component';

@Component({
  selector: 'app-cantieri-create-dialog',
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
    MatDialogClose
  ],
  templateUrl: './cantieri-create-dialog.component.html',
  styleUrl: './cantieri-create-dialog.component.css'
})
export class CantieriCreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<HomeGestioneCantieriComponent>);
  createCantiereForm: FormGroup;

  comuniList: string[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { groups: Group[], cantieri: WorkSite[] }){
    this.createCantiereForm = new FormGroup({
      name: new FormControl('', Validators.required),
      comune: new FormControl(''),
    });

    this.comuniList = data.groups.map(group => group.name);
  }

  onConfirm(): void {
    const newWorksiteName = this.createCantiereForm.get('name')?.value;

    if(!this.checkExistingWorksiteName(newWorksiteName)){
      if (this.createCantiereForm.valid) {
        this.dialogRef.close(this.createCantiereForm.value);
      }
    }
  }

  checkExistingWorksiteName(name: string): boolean{
    const worksiteNames = this.data.cantieri.map(cantiere => cantiere.name);

    return worksiteNames.includes(name);
  }
}

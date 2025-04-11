import { Component, EventEmitter, Input, model, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { WorkSite } from '../../../Models/Worksite';
import { CommonModule } from '@angular/common';
import { Vehicle } from '../../../Models/Vehicle';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-change-worksite',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './change-worksite.component.html',
  styleUrl: './change-worksite.component.css'
})
export class ChangeWorksiteComponent{
  @Input() worksites!: WorkSite[];
  @Output() worksiteChange: EventEmitter<{worksite: WorkSite, dateFrom: Date, comment: string}> = new EventEmitter<{worksite: WorkSite, dateFrom: Date, comment: string}>();
  @Input() vehicle!: Vehicle;

  changeWorksiteForm!: FormGroup;

  constructor(){
    this.changeWorksiteForm = new FormGroup({
      worksite: new FormControl([], Validators.required),
      dateFrom: new FormControl(Validators.required),
      comment: new FormControl("")
    });
  }

  save(){
    const { worksite, dateFrom, comment } = this.changeWorksiteForm.value;
    console.log('worksite extracted from form: ', worksite);
    const selectedWorksite = this.worksites.find(w => w.name == worksite);
    console.log('selectedWorksite: ', selectedWorksite);

    if(selectedWorksite){
      const creationData = {
        worksite: selectedWorksite,
        dateFrom: dateFrom,
        comment: comment
      }
      this.worksiteChange.emit(creationData);
    }
  }
}

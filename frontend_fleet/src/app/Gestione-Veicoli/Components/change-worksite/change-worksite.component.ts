import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Vehicle } from '../../../Models/Vehicle';
import { WorkSite } from '../../../Models/Worksite';
import { Group } from '../../../Models/Group';

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
export class ChangeWorksiteComponent implements OnChanges{
  @Input() worksites: WorkSite[] = [];
  @Output() worksiteChange: EventEmitter<{worksite: WorkSite, dateFrom: Date, comment: string}> = new EventEmitter<{worksite: WorkSite, dateFrom: Date, comment: string}>();
  @Input() vehicle!: Vehicle;

  changeWorksiteForm!: FormGroup;

  selectedWorksite!: WorkSite;

  sameWorksite: boolean = false;

  constructor(){
    this.changeWorksiteForm = new FormGroup({
      worksite: new FormControl([], Validators.required),
      dateFrom: new FormControl(Validators.required),
      comment: new FormControl("")
    });

    this.changeWorksiteForm.get("worksite")?.valueChanges
    .subscribe((selectedWorksiteId) => {
      const foundWorksite = this.worksites.find(w => w.id == selectedWorksiteId);
      if(foundWorksite) this.selectedWorksite =  foundWorksite;
      this.sameWorksite = this.checkSameWorksite();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['worksites']){
      this.worksites.push(new WorkSite(-1, "Libero", 0, []));
    }
    if(changes['vehicle']){
      this.changeWorksiteForm.get("worksite")?.setValue(this.vehicle.worksite?.id);
    }
  }

  save(){
    const { dateFrom, comment } = this.changeWorksiteForm.value;
    if(this.selectedWorksite?.id != this.vehicle?.worksite?.id){
      const creationData = {
        worksite: this.selectedWorksite,
        dateFrom: dateFrom,
        comment: comment
      }
      this.changeWorksiteForm.reset();
      this.worksiteChange.emit(creationData);
    }
  }

  /**
   * Controlla se il cantiere selezionato e il cantiere del veicolo sono uguali
   * @returns true se sono uguali
   * @returns false se sono diversi
   */
  checkSameWorksite(){
    return this.vehicle.worksite?.id == this.selectedWorksite?.id;
  }
}

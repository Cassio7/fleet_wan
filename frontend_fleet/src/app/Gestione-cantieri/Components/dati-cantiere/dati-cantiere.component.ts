import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { User } from '../../../Models/User';
import { WorkSite } from '../../../Models/Worksite';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { Group } from '../../../Models/Group';

@Component({
  selector: 'app-dati-cantiere',
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
  templateUrl: './dati-cantiere.component.html',
  styleUrl: './dati-cantiere.component.css'
})
export class DatiCantiereComponent implements OnDestroy, AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  cantiereForm: FormGroup;
  @Input() worksite!: WorkSite;
  @Input() groups!: Group[];

  errorText: string = "";
  isSaveable: boolean = false;

  snackBar: MatSnackBar = inject(MatSnackBar);


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private gestioneCantieriService: GestioneCantieriService
  ) {
    this.cantiereForm = new FormGroup({
      name: new FormControl(''),
      comune: new FormControl()
    });
  }

  ngAfterViewInit(): void {
    console.log('groups: ', this.groups);
    console.log('worksite: ', this.worksite);
    this.initForm();
  }


  private initForm(): void {
    if (this.worksite)
      this.cantiereForm.get('name')?.setValue(this.worksite.name);

    if(this.groups){
      const selectedGroup = this.groups.find(group => group.id == this.worksite.group.id);
      console.log('selectedGroup: ', selectedGroup);
      this.cantiereForm.get('comune')?.setValue(selectedGroup?.id);
    }

  }

  updateData(){
    const formValues = this.cantiereForm.value;
    const groupId = this.cantiereForm.get('comune')?.value;

    if(groupId){
      this.gestioneCantieriService.updateWorksiteById(this.worksite.id, formValues.name, groupId).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedWorksite: WorkSite) => {
          this.worksite = updatedWorksite;
          this.checkSaveable();
          this.openSnackbar(`Cantiere aggiornato con successo`);
        },
        error: error => console.error(`Errore nella modifica del cantiere: ${error}`)
      });
    }
  }

  checkSaveable() {
    this.isSaveable =
      this.worksite.name !== this.cantiereForm.get("name")?.value ||
      this.worksite.group.id !== this.cantiereForm.get("comune")?.value
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

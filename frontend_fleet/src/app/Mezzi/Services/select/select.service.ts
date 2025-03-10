import { Injectable } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class SelectService {
  private _allOptionsSelected: boolean = true;
  private _allestimenti = {
    blackboxOnly: true,
    blackboxWithAntenna: true
  };




  private _selectedVehicles: Vehicle[] = [];

  constructor() { }

  /**
   * Aggiorna i veicoli selezionati in base al modello di un veicolo
   * @param allVehicles tutti i veicoli
   * @param vehicle veicolo da cui prendere il modello da aggiungere, in caso, ai veicoli selezionati
   */
  updateVehiclesSelectionByModel(allVehicles: Vehicle[], vehVehicle: Vehicle) {
    const exists = this.selectedVehicles.some(v => v.model === vehVehicle.model); //controllo della presenza del veicolo nell'array dei veicoli selezionati

    if (!exists) {
      const addingVehicles = allVehicles.filter(v => v.model === vehVehicle.model);
      this.selectedVehicles = [...this.selectedVehicles, ...addingVehicles]; //aggiunta di tutti i veicoli con il modello del veicolo
    } else {
      this.selectedVehicles = this.selectedVehicles.filter(v => v.model !== vehVehicle.model); //rimozione di tutti i veicoli con il modello del veicolo
    }
  }


  /**
   * Aggiorna i veicoli selezionati in base al cantiere di un veicolo
   * @param vehiclesData tutti i veicoli
   * @param vehicle veicolo da cui prendere il cantiere da aggiungere, in caso, ai veicoli selezionati
   */
  updateVehiclesSelectionByCantiere(vehiclesData: Vehicle[], vehicle: Vehicle) {
    const exists = this.selectedVehicles.some(v => v.worksite?.name === vehicle.worksite?.name);

    if (!exists) {
      const addingVehicles = vehiclesData.filter(v => v.worksite?.name === vehicle.worksite?.name);
      this.selectedVehicles = [...this.selectedVehicles, ...addingVehicles];
    } else {
      this.selectedVehicles = this.selectedVehicles.filter(v => v.worksite?.name !== vehicle.worksite?.name);
    }
  }


  /**
   * Aggiorna i veicoli selezionati in base alla targa di un veicolo
   * @param allVehicles tutti i veicoli
   * @param vehicle veicolo da cui prendere la targa da aggiungere, in caso, ai veicoli selezionati
   */
  updateVehiclesSelectionByPlate(allVehicles: Vehicle[], vehicle: Vehicle) {
    const exists = this.selectedVehicles.some(v => v.plate === vehicle.plate);

    if (!exists) {
      const addingVehicles = allVehicles.filter(v => v.plate === vehicle.plate);
      this.selectedVehicles = [...this.selectedVehicles, ...addingVehicles];
    } else {
      this.selectedVehicles = this.selectedVehicles.filter(v => v.plate !== vehicle.plate);
    }
  }

  updateVehiclesSelectionByAllestimento(allVehicles: Vehicle[], option: string, selected: boolean): void {
    // Seleziona i veicoli con isRFIDReader = false (blackbox) e quelli con isRFIDReader = true (blackbox+antenna)
    const blackboxVehicles = allVehicles.filter(vehicle => !vehicle.isRFIDReader);
    const blackboxAntennaVehicles = allVehicles.filter(vehicle => vehicle.isRFIDReader);

    if(option == "blackbox"){ // è stato premuto l'opzione "blackbox"
      if(selected){ // l'opzione "blackbox" è stata selezionata
        this.allestimenti.blackboxOnly = true;
        this.selectedVehicles = [...this.selectedVehicles, ...blackboxVehicles];
      }else{ // l'opzione "blackbox" è stata deselezionata
        this.allestimenti.blackboxOnly = false;
        // Rimuovi i veicoli con isRFIDReader = false
        this.selectedVehicles = this.selectedVehicles.filter(vehicle => vehicle.isRFIDReader);
      }
    }else if(option == "blackbox+antenna"){ // è stato premuto l'opzione "blackbox+antenna"
      if(selected){ // l'opzione "blackbox+antenna" è stata selezionata
        this.allestimenti.blackboxWithAntenna = true;
        this.selectedVehicles = [...this.selectedVehicles, ...blackboxAntennaVehicles];
      }else{ // l'opzione "blackbox+antenna" è stata deselezionata
        this.allestimenti.blackboxWithAntenna = false;
        // Rimuovi i veicoli con isRFIDReader = true
        this.selectedVehicles = this.selectedVehicles.filter(vehicle => !vehicle.isRFIDReader);
      }
    }
  }


  /**
   * Aggiorna i veicoli selezionati in base al first event di un veicolo
   * @param allVehicles tutti i veicoli
   * @param vehicle veicolo da cui prendere il first event da aggiungere, in caso, ai veicoli selezionati
   */
  updateVehiclesSelectionByFirstEvent(allVehicles: Vehicle[], vehicle: Vehicle) {
    //data senza orario
    const getDateWithoutTime = (date: Date | null): string => {
      if (!date) return ''; // Se la data è null, restituisce una stringa vuota
      const actualDate = (date instanceof Date) ? date : new Date(date); // Converte la stringa in un oggetto Date se necessario
      return actualDate.toISOString().split('T')[0];  // Restituisce solo la parte della data, es. "2024-12-10"
    };

    const exists = this.selectedVehicles.some(v => getDateWithoutTime(v.firstEvent) === getDateWithoutTime(vehicle.firstEvent));

    if (!exists) {
      const addingVehicles = allVehicles.filter(v => getDateWithoutTime(v.firstEvent) === getDateWithoutTime(vehicle.firstEvent));
      this.selectedVehicles = [...this.selectedVehicles, ...addingVehicles];
    } else {
      this.selectedVehicles = this.selectedVehicles.filter(v => getDateWithoutTime(v.firstEvent) !== getDateWithoutTime(vehicle.firstEvent));
    }
  }

  /**
   * Seleziona e deseleziona tutti i veicoli
   * @param allVehicles tutti i veicoli
   * @param $event evento
   * @returns array di tutti i veicoli se non era tutto selezionato
   * altrimenti un array vuoto
   */
  selectDeselectAll(allVehicles: Vehicle[], $event: any) {
    $event.stopPropagation();

    //attributo preso a caso, poteva essere qualunque
    if (this.allOptionsSelected) {
      this.allOptionsSelected = false;
      this.selectedVehicles = [];
      return [];
    } else {
      this.allOptionsSelected = true;
      this.selectedVehicles = allVehicles;
      return allVehicles;
    }

  }

  /**
   * Imposta i veicoli selezionati
   * @param vehicles veicoli da selezionare
   */
  selectVehicles(vehicles: Vehicle[]) {
    this.selectedVehicles = vehicles;
  }

  /**
   * Controlla se una targa è stata selezionata
   * @param plate targa da controllare
   * @returns true se la targa è contenuta, false se la targa non appartiene
   * a nessun veicolo nell'array di veicoli selezionati
   */
  isPlateSelected(plate: string){
    const selectedPlates = this.selectedVehicles.map(vehicle => vehicle.plate);
    return selectedPlates.includes(plate);
  }

  /**
   * Controlla se un modello è stato selezionato
   * @param model modello da controllare
   * @returns true se il modello è contenuto, false se il modello non appartiene
   * a nessun veicolo nell'array di veicoli selezionati
   */
  isModelSelected(model: string){
    const selectedModels = this.selectedVehicles.map(vehicle => vehicle.model);
    return selectedModels.includes(model);
  }

  /**
   * Controlla se un cantiere è stato selezionato
   * @param model cantiere da controllare
   * @returns true se il cantiere è contenuto, false se il cantiere non appartiene
   * a nessun veicolo nell'array di veicoli selezionati
   */
  isCantiereSelected(worksite: string | undefined){
    if(worksite){
      const selectedCantieri = this.selectedVehicles.map(vehicle => vehicle.worksite?.name);
      return selectedCantieri.includes(worksite);
    }
    return false;
  }


  /**
   * Controlla se una data di installazione fleet è stata selezionata
   * @param model data da controllare
   * @returns true se la data di installazione è stata selezionata, false se non è stata selezionata
   */
  isFirsteventSelected(firstEvent: Date | null){
    if(firstEvent){
      const selectedFirstevents = this.selectedVehicles.map(vehicle => vehicle.firstEvent);
      return selectedFirstevents.includes(firstEvent);
    }
    return false;
  }

  /**
   * controlla il tipo di allestimento di ciascun veicolo nei veicoli selezionati
   * @param type tipo di veicoli da ritornare
   * @returns veicoli
   */
  checkAllestimento(type: string){
    return type == "blackbox" ?
    this.selectedVehicles.some(vehicle => vehicle.isRFIDReader === false) :
    this.selectedVehicles.some(vehicle => vehicle.isRFIDReader === true);
  }

  public get allestimenti() {
    return this._allestimenti;
  }
  public set allestimenti(value) {
    this._allestimenti = value;
  }
  public get selectedVehicles(): Vehicle[] {
    return this._selectedVehicles;
  }
  public set selectedVehicles(value: Vehicle[]) {
    this._selectedVehicles = value;
  }
  public get allOptionsSelected(): boolean {
    return this._allOptionsSelected;
  }
  public set allOptionsSelected(value: boolean) {
    this._allOptionsSelected = value;
  }
}

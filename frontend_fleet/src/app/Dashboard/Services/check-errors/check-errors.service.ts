import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonService } from '../../../Common-services/common service/common.service';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class CheckErrorsService {
  /**
   * Trasporta i dati dei veicoli nel caso uno spicchio venga deselezionato
   */
  private _fillTable$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) { }

    /**
   * Controlla se è presente un errore di GPS nella sessione di oggi del veicolo preso in input
   * @param vehicle
   * @returns l'anomalia se viene riscontrata, altrimenti "null"
   */
    checkGpsError(vehicle: { anomalySessions?: { date: string; anomalies?: { GPS?: string } }[] }): string | null {
      const dateFrom = this.commonService.dateFrom;
      const dateTo = this.commonService.dateTo;

      // Usa l'operatore opzionale e un array vuoto come fallback
      const anomalySessions = vehicle.anomalySessions ?? [];

      for (const session of anomalySessions) {
        const sessionDate = new Date(session.date);

        if (sessionDate >= dateFrom && sessionDate <= dateTo) {

          // Verifica se `anomalies` ha la proprietà GPS
          if (session.anomalies?.GPS) {
            return session.anomalies.GPS || 'Errore GPS';
          }
        }
      }
      return null; // Se non viene trovata alcuna anomalia
    }



  /**
   * Controlla se è presente un errore di antenna nella sessione di oggi del veicolo preso in input
   * @param vehicle
   * @returns l'anomalia se viene riscontrata, altrimenti "null"
   */
  checkAntennaError(vehicle: { anomalySessions?: { date: string; anomalies?: { Antenna?: string } }[] }): string | null {
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;

    // Verifica che `anomalySessions` sia definito e abbia elementi
    if (vehicle.anomalySessions && vehicle.anomalySessions.length > 0) {
      for (const session of vehicle.anomalySessions) {
        const sessionDate = new Date(session.date);

        // Se la sessione è nel range di date, verifica l'anomalia "antenna"
        if (sessionDate >= dateFrom && sessionDate <= dateTo) {
          if (session.anomalies?.Antenna) {
            return session.anomalies.Antenna || 'Errore antenna';
          }
        }
      }
    }

    return null; // Nessuna anomalia trovata
  }

  /**
   * Controlla se è presente un anomalia di sessione nella sessione di oggi del veicolo preso in input
   * @param vehicle veicolo da controllare
   * @returns
   */
  checkSessionError(vehicle: Vehicle): string | null {
    return vehicle.anomaliaSessione ?? null;
  }

  /**
   * Calcola da quanti giorni le sessioni di un veicolo sono in errore
   * @param vehicle veicolo da cui prendere l'ultimo evento
   * @returns differenza in giorni: oggi - lastevent
   */
  public calculateSessionErrorDays(vehicle: Vehicle): number {
    const todayDate = new Date(); //giorni di oggi

    //verifica che lastEvent non sia null
    if (!vehicle.lastEvent) {
      return -1;
    }

    const vehicleLastEvent = new Date(vehicle.lastEvent); //ultimo evento del veicolo

    const differenceInMillis = todayDate.getTime() - vehicleLastEvent.getTime(); //differenza in millisecondi
    const differenceInDays = Math.floor(differenceInMillis / (1000 * 60 * 60 * 24)); //conversione differenza in giorni

    return differenceInDays;
  }

  /**
   * Controlla i gps dei veicoli passati come parametro
   * @param allVehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, warningVehicles]
   */
  public checkVehiclesGpsErrors(allVehicles: Vehicle[]){
    const workingVehicles: Vehicle[] = [];
    const warningVehicles: Vehicle[] = [];

    allVehicles.map(vehicle => {
      if(this.checkGpsError(vehicle)){
        warningVehicles.push(vehicle);
      }else{
        workingVehicles.push(vehicle);
      }
    });

    return [workingVehicles, warningVehicles];
  }



  /**
 * Controlla gli errori di tutti i veicoli con sessioni in un determinato arco di tempo
 * @param dateFrom data di inizio ricerca
 * @param dateTo data di fine ricerca
 * @returns observable http
 */
  public checkErrorsAllRanged(dateFrom: Date, dateTo: Date): Observable<any>{
    const body = {
      dateFrom: dateFrom,
      dateTo: dateTo
    }
    return this.http.post(`http://10.1.0.102:3001/session/checkerrors/all`, body);
  }

  /**
 * Controlla gli errori di tutti i veicoli con sessioni nella giornata di oggi
 * @param dateFrom data di inizio ricerca
 * @param dateTo data di fine ricerca
 * @returns observable http
*/
  public checkErrorsAllToday(): Observable<any>{
    const body = {
      dateFrom: this.commonService.dateFrom,
      dateTo: this.commonService.dateTo
    }
    return this.http.post(`http://10.1.0.102:3001/session/checkerrors/all`, body);
  }


  public get fillTable$(): BehaviorSubject<any[]> {
    return this._fillTable$;
  }
}

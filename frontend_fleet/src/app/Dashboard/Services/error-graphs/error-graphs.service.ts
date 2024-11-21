import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorGraphsService{
  private _loadGraphData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private _series = [0,0,0];//[funzionante, warning, error]
  private _colors = ["#46ff00", "#ffd607", "#ff0000"];

  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }

  /**
  * Permette di preparare l'array per riempire il grafico degli errori
  * e notifica e manda i dati al grafico tramite un subject
  * @param vehicles oggetto custom di veicoli
  */
  public loadChartData(vehicles: any[]) {
    for (const vehicle of vehicles) {
      const hasGpsError = this.checkErrorsService.checkGpsError(vehicle);
      const hasSessionError = this.checkErrorsService.checkSessionError(vehicle);
      const hasAntennaError = this.checkErrorsService.checkAntennaError(vehicle);

      // Controllo errore GPS (warning) - solo se non ci sono altri errori
      if (hasGpsError && !hasSessionError && !hasAntennaError) {
        this._series[1] += 1;
      }
      // Controllo errore antenna (Errore) - solo se non ci sono altri errori
      else if (hasAntennaError && !hasSessionError && !hasGpsError) {
        this._series[2] += 1;
      }
      // Controllo errore sessione (Errore) - solo se non ci sono altri errori
      else if (hasSessionError && !hasGpsError && !hasAntennaError) {
        this._series[2] += 1;
      }
      else if (hasAntennaError && hasSessionError){ //Controllo errori di sessione e antenna (Errore)
        this.series[2] += 1;
      }
      // Controllo nessun errore (funzionante)
      else if (!hasGpsError && !hasSessionError && !hasAntennaError) {
        this._series[0] += 1;
      }
    }

    console.log(this._series);
    this._loadGraphData$.next(this._series);
  }




  public get loadGraphData$(): BehaviorSubject<any> {
    return this._loadGraphData$;
  }
  public get colors() {
    return this._colors;
  }
  public get series() {
    return this._series;
  }
}

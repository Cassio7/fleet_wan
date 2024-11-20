import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorGraphsService{
  private _loadGraphData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private _values = [44, 55, 13];
  private _colors = ["#46ff00", "#ffd607", "#ff0000"];

  constructor() { }


  public loadChartData(vehicles: any[]) {
    let series: number[] = [];
    try {
      // Inizializza i contatori
      let working = 0;
      let warning = 0;
      let error = 0;

      // Itera sui veicoli
      for (const v of vehicles) {
        const anomalies = v.sessions?.[0]?.anomalies || [];

        //ricerca anomalie
        const gpsAnomalies = anomalies.some((anomaly: any) => 'GPS' in anomaly);
        const antennaAnomalies = anomalies.some((anomaly: any) => 'antenna' in anomaly);
        const sessionAnomalies = anomalies.some((anomaly: any) => 'sessionEnd' in anomaly);

        //controllo anomalie
        if (antennaAnomalies || sessionAnomalies) {
          error += 1;
        } else if (gpsAnomalies && !antennaAnomalies && !sessionAnomalies) {
          warning += 1;
        } else {
          working += 1;
        }
      }

      series = [working, warning, error];
      console.log("SERIES IN SERVICE: ", series);


      this._loadGraphData$.next(series);//carica dati nel grafico
    } catch (error) {
      console.error("Error loading chart data: ", error);
    }
  }

  public get loadGraphData$(): BehaviorSubject<any> {
    return this._loadGraphData$;
  }
  public get colors() {
    return this._colors;
  }
  public get values() {
    return this._values;
  }
}

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  Observable,
  Subject,
  throwError,
} from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';
import { Anomaly } from '../../Models/Anomaly';
import { CookieService } from 'ngx-cookie-service';
import { SessionErrorVehicles } from '../../Dashboard/Services/kanban-sessione/kanban-sessione.service';
import { Stats } from '../../Models/Stats';
import { Vehicle } from '../../Models/Vehicle';
import { serverUrl } from '../../environment';

export interface VehicleAnomalies{
  vehicle: Vehicle,
  anomalies: Anomaly[]
}
@Injectable({
  providedIn: 'root',
})
export class CheckErrorsService {
  /**
   * Trasporta i dati dei veicoli nel caso uno spicchio venga deselezionato
   */
  private readonly _fillTable$: BehaviorSubject<any[]> = new BehaviorSubject<
    any[]
  >([]);
  private readonly _switchCheckDay$: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  private readonly _updateAnomalies$: Subject<void> = new Subject<void>();

  private url: string = "anomaly";

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
  ) {}

  /**
   * Controlla se è presente un errore di GPS nella sessione, nel range temporale , del veicolo preso in input
   * @param vehicle
   * @returns l'anomalia se viene riscontrata, altrimenti "null"
   */
  checkVehicleGpsError(vehicleData: VehicleData): string | null | undefined {
    const gpsAnomaly: string | undefined | null =
      this.checkVehicleAnomaly(vehicleData)?.gps;
    return this.checkGpsError(gpsAnomaly);
  }

  /**
   * Controlla se l'anomalia di GPS è un GPS
   * @param anomaly anomalia di gps
   * @returns anomalia nel caso sia un errore
   * @returns null se l'anomalia non è un errore
   */
  checkGpsError(anomaly: string | null | undefined): string | null {
    if (
      anomaly &&
      typeof anomaly === 'string' &&
      (anomaly.includes('TOTALE') ||
        anomaly.includes('totale') ||
        anomaly.includes('Totale'))
    ) {
      return anomaly;
    }
    return null;
  }

  /**
   * Controlla se è presente un warning di GPS nella sessione, nel range temporale , del veicolo preso in input
   * @param vehicle
   * @returns l'anomalia se viene riscontrata, altrimenti "null"
   */
  checkVehicleGPSWarning(vehicleData: VehicleData): string | null {
    const gpsAnomaly: string | undefined | null =
      this.checkVehicleAnomaly(vehicleData)?.gps;

    return this.checkGpsWarning(gpsAnomaly);
  }

  /**
   * Controlla se l'anomalia di GPS è uno warning
   * @param anomaly anomalia di gps
   * @returns anomalia nel caso sia uno warning
   * @returns null se l'anomalia non è uno warning
   */
  checkGpsWarning(anomaly: string | null | undefined): string | null {
    if (
      anomaly &&
      typeof anomaly === 'string' &&
      !(
        anomaly.includes('TOTALE') ||
        anomaly.includes('totale') ||
        anomaly.includes('Totale')
      )
    ) {
      return anomaly;
    }
    return null;
  }

  /**
   * Controlla se è presente un errore di antenna del veicolo preso in input
   * @param vehicle veicolo da controllare
   * @returns l'anomalia se viene riscontrata, altrimenti "null"
   */
  checkVehicleAntennaError(vehicleData: VehicleData): string | null {
    return this.checkVehicleAnomaly(vehicleData)?.antenna || null;
  }

  checkVehicleAntennaValid(vehicleData: VehicleData): boolean{
    const vehicleAnomalies = this.checkVehicleAnomaly(vehicleData);
    if(vehicleAnomalies){
      return this.checkAntennaValid(vehicleAnomalies);
    }
    return false;
  }

  /**
   * Controlla se il controllo sull'antenna è valido o incerto
   * @param anomaly oggetto anomalie
   * @returns true se il controllo è valido
   * @returns false se il controllo è incerto
   */
  checkAntennaValid(anomaly: Anomaly){
    return !anomaly.antenna && anomaly.detection_quality ? true : false;
  }

  /**
   * Controlla la qualità di lettura di un mezzo
   * @param vehicle veicolo da controllare
   * @returns risultato dell'analisi sulla qualità di lettura che può essere dalla migliore alla peggiore: "Excellent", "Good" o "Poor"
   */
  checkVehicleDetectionQuality(vehicleData: VehicleData): string | null {
    return this.checkVehicleAnomaly(vehicleData)?.detection_quality || null;
  }

  /**
   * Controlla se è presente un anomalia di sessione del veicolo preso in input nell'arco di tempo definito nel common service
   * @param vehicle veicolo da controllare
   * @returns tipo di anomalia di sessione se trovata
   * @returns null se non viene trovata un'anomalia
   */
  checkVehicleSessionError(vehicleData: VehicleData): string | null {
    return this.checkVehicleAnomaly(vehicleData)?.session || null;
  }

  /**
   * Controlla se il veicolo ha giornate con anomalie nell'arco di tempo specificato nel commonService
   * @param vehicleData dati del veicolo da controllare
   * @returns oggetto anomalia se presente
   * @returns null se non sono presenti anomalie
   */
  checkVehicleAnomaly(vehicleData: VehicleData): Anomaly | null {
    const anomalies: Anomaly[] = vehicleData.anomalies;
    //controllo sulla presenza anomalie
    if (!anomalies) {
      return null;
    }

    //ricerca anomalia nell'arco di tempo richiesto
    const foundAnomaly: any = Object.values(anomalies).find(
      (anomaliesObj: Anomaly) => {
        const anomalyDate = new Date(anomaliesObj.date); // Data delle anomalie
        anomalyDate.setHours(0, 0, 0, 0);
        return anomalyDate;
      }
    );

    return foundAnomaly ? foundAnomaly : null;
  }

  getVehicleSessionAnomalyCount(vehicleData: VehicleData): number | null {
    const anomalies = this.checkVehicleAnomaly(vehicleData);
    if (anomalies) {
      return anomalies.session_count;
    }
    return null;
  }

  getVehicleAntennaAnomalyCount(vehicleData: VehicleData): number | null {
    const anomalies = this.checkVehicleAnomaly(vehicleData);
    if (anomalies) {
      return anomalies.antenna_count;
    }
    return null;
  }

  getVehicleGPSAnomalyCount(vehicleData: VehicleData): number | null {
    const anomalies = this.checkVehicleAnomaly(vehicleData);
    if (anomalies) {
      return anomalies.gps_count;
    }
    return null;
  }

  /**
   * Calcola da quanti giorni le sessioni di un veicolo sono in errore
   * @param vehicle veicolo da cui prendere l'ultimo evento
   * @returns differenza in giorni: oggi - lastevent
   */
  public calculateVehicleSessionErrorDays(
    vehicleData: VehicleData
  ): number | null {
    const anomaly: Anomaly | null = this.checkVehicleAnomaly(vehicleData);

    if (anomaly && anomaly.date) {
      return this.calculateSessionErrorDays(anomaly.date);
    }

    return null;
  }

  calculateSessionErrorDays(sessionDate: Date | string): number {
    if (sessionDate) {
      sessionDate = new Date(sessionDate);

      const stateDate: number = sessionDate.setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      const diffInMilliseconds: number = today - stateDate;
      const diffInDays: number = diffInMilliseconds / (1000 * 60 * 60 * 24);

      return Math.round(diffInDays);
    } else {
      return 0;
    }
  }

  /**
   * Controlla i gps dei veicoli passati come parametro
   * @param vehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, warningVehicles, errorVehicles]
   */
  public checkVehiclesGpsErrors(
    vehiclesData: VehicleData[]
  ): [VehicleData[], VehicleData[], VehicleData[]] {
    const workingVehicles: VehicleData[] = [];
    const warningVehicles: VehicleData[] = [];
    const errorVehicles: VehicleData[] = [];

    vehiclesData.forEach((vehicleData) => {
      //controllo errore gps
      if (this.checkVehicleGpsError(vehicleData)) {
        errorVehicles.push(vehicleData);
      }
      //controllo warning gps
      else if (this.checkVehicleGPSWarning(vehicleData)) {
        warningVehicles.push(vehicleData);
      }
      //veicolo in funzionamento corretto
      else {
        workingVehicles.push(vehicleData);
      }
    });

    return [workingVehicles, warningVehicles, errorVehicles];
  }

  /**
   * Controlla il tipo di anomalia di GPS
   * @param gpsAnomaly anomalia di GPS
   * @returns "Errore", "Warning" in base al tipo di anomalia e "Funzionante"
   * nel caso non sia presente anomalia
   */
  checkGPSAnomalyType(gpsAnomaly: string | null) {
    if (this.checkGpsError(gpsAnomaly)) {
      return 'Errore';
    } else if (gpsAnomaly) {
      return 'Warning';
    } else {
      return 'Funzionante';
    }
  }

  /**
   * Permette di dividere i veicoli passati in base al loro tipo di anomalia di sessione
   * @param vehicles veicoli da analizzare
   * @returns oggetto SessionErrorVehicles
   */
  getVehiclesSessionAnomalyTypes(
    vehicles: VehicleData[]
  ): SessionErrorVehicles {
    const filterVehiclesByAnomaly = (anomalyType: string) => {
      return vehicles.filter((vehicle) => {
        const sessionAnomaly = this.checkVehicleAnomaly(vehicle)?.session;
        return sessionAnomaly?.includes(anomalyType);
      });
    };

    const nullVehicles = filterVehiclesByAnomaly('nulla');
    const stuckVehicles = filterVehiclesByAnomaly('bloccati');
    const powerVehicles = filterVehiclesByAnomaly('alimentazione');

    const errorVehicles: SessionErrorVehicles = {
      nullVehicles,
      stuckVehicles,
      powerVehicles,
    };

    return errorVehicles;
  }

  getVehicleSessionAnomalyType(vehicleData: VehicleData): string {
    const vehicleSessionAnomaly =
      this.checkVehicleAnomaly(vehicleData)?.session;

    if (
      vehicleSessionAnomaly?.includes('Nulla') ||
      vehicleSessionAnomaly?.includes('nulla')
    ) {
      return 'Nulla';
    } else if (
      vehicleSessionAnomaly?.includes('Bloccati') ||
      vehicleSessionAnomaly?.includes('bloccati')
    ) {
      return 'Bloccata';
    } else {
      return 'Alimentazione';
    }
  }

  /**
   * Controlla le antenne dei veicoli passati come parametro
   * @param vehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, errorVehicles]
   */
  public checkVehiclesAntennaErrors(vehiclesData: VehicleData[]) {
    const workingVehicles: VehicleData[] = [];
    const errorVehicles: VehicleData[] = [];

    vehiclesData.map((vehicleData) => {
      if (vehicleData.vehicle?.isRFIDReader) {
        const antennaCheck = this.checkVehicleAntennaError(vehicleData);
        if (antennaCheck) {
          errorVehicles.push(vehicleData);
        } else {
          workingVehicles.push(vehicleData);
        }
      }
    });
    return [workingVehicles, errorVehicles];
  }

  /**
   * Controlla l'anomalia di sessione dei veicoli passati come parametro
   * @param vehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, errorVehicles]
   */
  checkVehiclesSessionErrors(vehiclesData: VehicleData[]) {
    const workingVehicles: VehicleData[] = [];
    const errorVehicles: VehicleData[] = [];

    vehiclesData.map((vehicleData) => {
      const sessionCheck = this.checkVehicleSessionError(vehicleData);
      if (sessionCheck) {
        errorVehicles.push(vehicleData);
      } else {
        workingVehicles.push(vehicleData);
      }
    });
    return [workingVehicles, errorVehicles];
  }

  /**
   * Ricava la data della'anomalia di sessione di un veicolo
   * @param vehicleData veicolo da analizzare
   * @returns data
   */
  getVehicleSessionAnomalyDate(vehicleData: VehicleData): Date | null {
    const anomalies: Anomaly[] = vehicleData.anomalies;

    if (!anomalies || !Array.isArray(anomalies)) {
      return null;
    }

    const foundAnomaly = anomalies[0];

    return foundAnomaly ? new Date(foundAnomaly.date) : null;
  }

  /**
   * Estrae la data di una anomalia
   * @param anomaly anomalia
   * @returns data dell'anomalia
   * @returns null se la data non è presente
   */
  getAnomalyDate(anomaly: Anomaly): Date | null {
    return anomaly ? new Date(anomaly.date) : null;
  }

  /**
   * Formatta una data nel formato yyyy/MM/dd
   * @param date data da formattare
   * @returns data formattata sottoforma di stringa
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Permette di eseguire una chiamata al database che ritorna le anomalie di GPS, antenna e sessione di un veicolo
   * @param veId veId del veicolo di cui ricercare le anomalie
   * @param count numero di giornate, a partire da oggi, di cui prendere le anomalie
   * @returns oggetto VehicleAnomalies con numero di elementi nell'array anomalies quanto il valore di "count"
   */
  public checkAnomaliesByVeId(
    veId: number,
    count: number
  ): Observable<VehicleAnomalies> {
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    const params = new HttpParams()
    .set("veId", veId)
    .set("count", count)

    return this.http.get<VehicleAnomalies>(
      `${serverUrl}/${this.url}/veId`,
      { headers, params }
    );
  }

  getStatsByVeId(veId: number): Observable<Stats> {
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    const params = new HttpParams().set('veId', veId);

    return this.http.get<Stats>(`${serverUrl}/${this.url}/stats`, {
      headers,
      params,
    });
  }

  /**
   * Richiama l'API per l'aggiornamento delle anomalie ad oggi
   * @returns observable http get
   */
  updateAnomalies(): Observable<any> {
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.get(`${serverUrl}/${this.url}/updatetoday`, {
      headers,
    });
  }

  /**
   * Controlla gli errori di tutti i veicoli con sessioni in un determinato arco di tempo
   * @param dateFrom data di inizio ricerca
   * @param dateTo data di fine ricerca
   * @returns observable http get
   */
  public checkErrorsAllRanged(dateFrom: Date, dateTo: Date): Observable<any> {
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    const params = new HttpParams()
    .set("dateFrom", this.formatDate(dateFrom))
    .set("dateTo", this.formatDate(dateTo))

    return this.http
      .get(`${serverUrl}/anomaly/ranged`, { headers, params })
      .pipe(
        catchError((error) => {
          console.error('An error occurred:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Controlla gli errori di tutti i veicoli con sessioni nella giornata di oggi
   * @returns observable http get
   */
  public checkErrorsAllToday(): Observable<any> {
    return this.checkErrorsAllRanged(new Date(), new Date());
  }

  public get updateAnomalies$(): Subject<void> {
    return this._updateAnomalies$;
  }
  public get fillTable$(): BehaviorSubject<any[]> {
    return this._fillTable$;
  }
  public get switchCheckDay$(): BehaviorSubject<string> {
    return this._switchCheckDay$;
  }
}

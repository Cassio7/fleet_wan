import { NotFoundException } from '@nestjs/common';
import { parse } from 'csv-parse';
import * as fs from 'fs';

/**
 * Funzione che converte un orario del timestamp in base al fuso orario
 * @param timestamp timestamp di partenza
 * @returns timestamp corretto
 */
export function convertHours(timestamp: string): string {
  // Crea un oggetto Date a partire dal timestamp
  const date = new Date(timestamp);

  // Converte la data nel fuso orario italiano (Europe/Rome)
  const localTime = new Date(
    date.toLocaleString('en-US', { timeZone: 'Europe/Rome' }),
  );

  // Ottieni la data come stringa in formato UTC
  let updatedTimestamp = new Date(localTime).toISOString();

  // Rimuovi il suffisso 'Z' e aggiungi '+00' per indicare il fuso orario UTC
  updatedTimestamp = updatedTimestamp.replace('Z', '+00');

  return updatedTimestamp;
}

/**
 * Ritorna il range di date diviso giorno per giorno
 * @param startDate data di inizio
 * @param endDate data di fine
 * @returns
 */
export function getDaysInRange(startDate, endDate) {
  const currentDate = new Date(startDate);
  const dates = [];

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

/**
 * Metodo per parsing del file CSV
 * @returns
 */
export async function parseCsvFile(cvsPath: string): Promise<any[]> {
  if (!fs.existsSync(cvsPath)) {
    throw new NotFoundException(`File CSV non trovato: ${cvsPath}`);
  }
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    fs.createReadStream(cvsPath) // Usa il percorso calcolato
      .pipe(parse({ columns: true })) // Usa columns: true per ottenere oggetti chiave-valore
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

export type ValidationResult = {
  isValid: boolean;
  message?: string;
};

/**
 * Funzione per validare un range di date.
 * @param dateFrom Data iniziale (stringa).
 * @param dateTo Data finale (stringa).
 * @returns Oggetto con esito della validazione.
 */
export function validateDateRange(
  dateFrom: string,
  dateTo: string,
): ValidationResult {
  // Controlla se dateFrom e dateTo sono forniti
  if (!dateFrom || !dateTo) {
    return { isValid: false, message: 'Date non fornite.' };
  }
  // Crea un oggetto Date dalla stringa fornita
  const dateFrom_new = new Date(dateFrom);
  const dateTo_new = new Date(dateTo);
  // Controlla se la data è valida
  if (isNaN(dateFrom_new.getTime()) || isNaN(dateTo_new.getTime())) {
    return { isValid: false, message: 'Formato della data non valido.' };
  }
  if (dateFrom_new.getTime() >= dateTo_new.getTime()) {
    // Restituisci un errore se la condizione è vera
    return {
      isValid: false,
      message:
        'La data iniziale deve essere indietro di almeno 1 giorno dalla finale.',
    };
  }
  return { isValid: true };
}

/**
 * Filtra il token nell'header della richiesta
 * @param request la richiesta http
 * @returns ritorna il token filtrato se presente
 */
export function extractTokenFromHeader(request: Request): string | undefined {
  try {
    const { authorization }: any = request.headers;
    const [type, token] = authorization.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  } catch (error) {
    console.error(error.message);
  }
}

/**
 * Mette in ordine per targa gli elementi passati dal redis
 * @param data solitamente anomalie
 * @returns
 */
export function sortRedisData(data: any) {
  return data.sort((a: any, b: any) => {
    if (a.vehicle.plate < b.vehicle.plate) {
      return -1;
    }
    if (a.vehicle.plate > b.vehicle.plate) {
      return 1;
    }
    return 0;
  });
}

/**
 * Mette asterischi sulla password per il log utente, evita password in chiaro
 * @param body body della richiesta
 * @returns
 */
export function passwordLogMask(
  body: Record<string, any>,
): Record<string, any> {
  const clonedBody = { ...body };
  if (clonedBody.password) {
    clonedBody.password = '******'; // Maschera la password
  }
  return clonedBody;
}

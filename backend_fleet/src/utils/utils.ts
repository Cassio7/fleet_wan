import * as fs from 'fs';
import { parse } from 'csv-parse';
import { NotFoundException } from '@nestjs/common';

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
  let currentDate = new Date(startDate);
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

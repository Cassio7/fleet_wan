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
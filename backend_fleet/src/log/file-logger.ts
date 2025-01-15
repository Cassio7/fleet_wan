import * as winston from 'winston';

export const fileLogger = winston.createLogger({
  level: 'info', // Puoi specificare il livello minimo da loggare
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(), // Formato JSON per analisi strutturate
  ),
  transports: [
    new winston.transports.File({
      filename: 'application.log', // Nome del file di log
      dirname: './logs', // Directory dove salvare i log
      maxsize: 5 * 1024 * 1024, // 5MB per file
      maxFiles: 5, // Rotazione automatica: massimo 5 file
    }),
  ],
});

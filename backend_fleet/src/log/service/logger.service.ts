import { Injectable, Logger } from '@nestjs/common';
import { LogContext, LogError } from '../logger.types';
import { fileLogger } from '../file-logger';

@Injectable()
export class LoggerService extends Logger {
  private formatBaseMessage(context: LogContext, operation: string): string {
    return context.resourceId
      ? `${context.resource} ${operation} ID: ${context.resourceId} - UserID: ${context.userId}, Username: ${context.username}`
      : `${context.resource} ${operation} - UserID: ${context.userId}, Username: ${context.username}`;
  }

  /**
   * Servizio per stampare a video il messaggio di log con successo
   * @param context oggetto LogContext con informazioni su utente e risorsa
   * @param operation tipo di operazione CRUD
   * @param details dettagli aggiuntivi
   */
  logCrudSuccess(context: LogContext, operation: string, details?: string) {
    const baseMessage = this.formatBaseMessage(context, operation);
    const message = details ? `${baseMessage} - ${details}` : baseMessage;
    this.log(message);
    fileLogger.info(message);
  }

  /**
   * Servizio per stampare a video il messaggio di log per errori
   * @param param0 oggetto LogError
   */
  logCrudError({ error, context, operation }: LogError) {
    const baseMessage = this.formatBaseMessage(context, operation);
    const isClientError = error?.status && error.status < 500;
    const logMethod = isClientError ? 'warn' : 'error';

    const message = isClientError
      ? `${baseMessage}, Message: ${error.message}`
      : `${baseMessage}, Stack: ${error.stack || error.message}`;

    this[logMethod](message);

    fileLogger.error(message);
  }
}

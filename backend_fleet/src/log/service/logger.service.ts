import { Injectable, Logger } from '@nestjs/common';
import { LogContext, LogError } from '../logger.types';
import { fileLogger } from '../file-logger';
import { Request } from 'express';
import { passwordLogMask } from 'src/utils/utils';

@Injectable()
export class LoggerService extends Logger {
  private formatBaseMessage(context: LogContext, operation: string): string {
    return context.resourceId
      ? `${context.resource} ${operation} ID: ${context.resourceId} - UserID: ${context.userId}, Username: ${context.username}`
      : `${context.resource} ${operation} - UserID: ${context.userId}, Username: ${context.username}`;
  }

  /**
   * Recupera informazioni riguardanti il client ad ogni chiamata dove è presente
   * il controllo del token
   * @param request Richiesta del client
   */
  logClientData(request: Request) {
    // Informazioni base
    const clientIp = request.ip;
    const realIp = (
      request.headers['x-real-ip'] ||
      request.headers['x-forwarded-for'] ||
      request.socket.remoteAddress ||
      'N/A'
    ).toString();
    const userAgent = request.get('user-agent') || 'N/A';
    const method = request.method;
    const url = request.originalUrl;
    const queryParams = JSON.stringify(request.query);
    const body = JSON.stringify(passwordLogMask(request.body));

    // Headers e routing
    const referer = request.get('referer') || 'N/A';
    const language = request.get('accept-language') || 'N/A';
    const authorization = request.get('authorization') || 'N/A';
    const contentType = request.get('content-type') || 'N/A';
    const host = request.get('host') || 'N/A';
    const origin = request.get('origin') || 'N/A';

    // Informazioni di connessione
    const protocol = request.protocol;
    const isSecure = request.secure;
    const xhr = request.xhr;
    const path = request.path;
    const baseUrl = request.baseUrl;

    // Dati sessione e richiesta
    const cookies = JSON.stringify(request.cookies) || 'N/A';
    const xRequestId = request.get('x-request-id') || 'N/A';

    // Route params se esistono
    const routeParams = JSON.stringify(request.params) || 'N/A';

    const message = `Richiesta eseguita:
  - IP: ${clientIp}
  - IP Reale: ${realIp}
  - Host: ${host}
  - Origin: ${origin}
  - User-Agent: ${userAgent}
  - Metodo: ${method}
  - Base URL: ${baseUrl}
  - Path: ${path}
  - URL Completo: ${url}
  - Route Params: ${routeParams}
  - Query Params: ${queryParams}
  - Body: ${body}
  - Content-Type: ${contentType}
  - Referer: ${referer}
  - Lingua: ${language}
  - Protocollo: ${protocol}
  - HTTPS: ${isSecure}
  - XHR: ${xhr}
  - Authorization Header: ${authorization}
  - X-Request-ID: ${xRequestId}
  - Cookies: ${cookies}`;

    this.log(message);
    fileLogger.info(message);
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

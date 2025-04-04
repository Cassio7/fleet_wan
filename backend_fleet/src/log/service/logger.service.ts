import { Injectable, Logger } from '@nestjs/common';
import { LogContext, LogError } from '../logger.types';
import { fileLogger } from '../file-logger';
import { Request } from 'express';
import { passwordLogMask } from 'src/utils/utils';

@Injectable()
export class LoggerService extends Logger {
  private formatBaseMessage(
    context: LogContext,
    operation: string,
  ): Record<string, any> {
    return {
      resource: context.resource,
      operation,
      resourceId: context.resourceId || null,
      resourceKey: context.resourceKey || null,
      userId: context.userId,
      username: context.username,
    };
  }

  logClientData(request: Request): void {
    const logData = {
      client: {
        ip: request.ip,
        realIp:
          request.headers['x-real-ip'] ||
          request.headers['x-forwarded-for'] ||
          request.socket.remoteAddress ||
          'N/A',
        userAgent: request.get('user-agent') || 'N/A',
      },
      request: {
        method: request.method,
        url: request.originalUrl,
        baseUrl: request.baseUrl,
        path: request.path,
        queryParams: request.query,
        body: passwordLogMask(request.body),
        headers: {
          referer: request.get('referer') || 'N/A',
          language: request.get('accept-language') || 'N/A',
          authorization: request.get('authorization') || 'N/A',
          contentType: request.get('content-type') || 'N/A',
          host: request.get('host') || 'N/A',
          origin: request.get('origin') || 'N/A',
        },
      },
      connection: {
        protocol: request.protocol,
        isSecure: request.secure,
        xhr: request.xhr,
      },
      session: {
        cookies: request.cookies || 'N/A',
        xRequestId: request.get('x-request-id') || 'N/A',
      },
      routeParams: request.params || 'N/A',
    };

    this.log(logData); // Console log
    fileLogger.info(logData); // Salva nel file come JSON
  }

  logCrudSuccess(
    context: LogContext,
    operation: string,
    details?: string,
  ): void {
    const logData = this.formatBaseMessage(context, operation);
    if (details) {
      logData['details'] = details;
    }

    this.log(logData); // Console log
    fileLogger.info(logData); // Salva nel file come JSON
  }

  logCrudError({ error, context, operation }: LogError): void {
    const baseMessage = this.formatBaseMessage(context, operation);
    const logData = {
      ...baseMessage,
      error: {
        message: error.message,
        stack: error.stack || 'N/A',
        status: error?.status || 'N/A',
      },
    };

    const isClientError = error?.status && error.status < 500;
    const logMethod = isClientError ? 'warn' : 'error';

    this[logMethod](logData); // Console log
    fileLogger[logMethod](logData); // Salva nel file come JSON
  }
}

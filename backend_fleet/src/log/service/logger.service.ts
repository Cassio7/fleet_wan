import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogEntity } from 'src/classes/entities/log.entity';
import { Request } from 'express';
import { passwordLogMask } from 'src/utils/utils';
import { Repository } from 'typeorm';
import { fileLogger } from '../file-logger';
import { LogContext, LogError } from '../logger.types';

@Injectable()
export class LoggerService extends Logger {
  constructor(
    @InjectRepository(LogEntity, 'mainConnection')
    private readonly logRepository: Repository<LogEntity>,
  ) {
    super();
  }
  private serverInfo = 'unknown';

  setServerInfo(info: string) {
    this.serverInfo = info;
  }

  private formatBaseMessage(
    context: LogContext,
    operation: string,
  ): Record<string, any> {
    return {
      server: this.serverInfo,
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

  async logCrudSuccess(
    context: LogContext,
    operation: string,
    details?: string,
  ): Promise<void> {
    const logData = this.formatBaseMessage(context, operation);
    if (details) {
      logData['details'] = details;
    }

    this.log(logData); // Console log
    fileLogger.info(logData); // Salva nel file come JSON
    await this.createLogSucces(logData, 'info');
  }

  async logCrudError({ error, context, operation }: LogError): Promise<void> {
    const baseMessage = this.formatBaseMessage(context, operation);
    const logData = {
      ...baseMessage,
      error: {
        message: error.message,
        stack: error.stack || 'N/A',
        status: error?.status || -1,
      },
    };

    const isClientError = error?.status && error.status < 500;
    const logMethod = isClientError ? 'warn' : 'error';

    this[logMethod](logData); // Console log
    fileLogger[logMethod](logData); // Salva nel file come JSON
    await this.createLogError(logData, logMethod);
  }

  private async createLogSucces(logData: Record<string, any>, level: string) {
    // non utilizzo una transazione perchè è una singola operazione e si tratta di logs
    try {
      const newLog = await this.logRepository.create({
        level: level,
        timestamp: new Date(),
        server: logData['server'],
        resource: logData['resource'],
        operation: logData['operation'],
        resourceId: logData['resourceId'],
        resourceKey: logData['resourceKey'],
        userId: logData['userId'],
        username: logData['username'],
      });
      await this.logRepository.save(newLog);
    } catch (error) {
      console.log('Errore salvataggio logs', error);
    }
  }

  private async createLogError(logData: Record<string, any>, level: string) {
    try {
      const newLog = await this.logRepository.create({
        level: level,
        timestamp: new Date(),
        server: logData['server'],
        resource: logData['resource'],
        operation: logData['operation'],
        resourceId: logData['resourceId'],
        resourceKey: logData['resourceKey'],
        userId: logData['userId'],
        username: logData['username'],
        errorMessage: logData['error']?.message,
        errorStack: logData['error']?.stack.replace(/\n/g, ' |'),
        errorStatus: logData['error']?.status,
      });
      await this.logRepository.save(newLog);
    } catch (error) {
      console.log('Errore salvataggio logs', error);
    }
  }
}

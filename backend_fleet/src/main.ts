import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { fileLogger } from './log/file-logger';
import { LoggerService } from './log/service/logger.service';

async function bootstrap(): Promise<void> {
  const port = process.env.PORT || 3003;

  const logger = new Logger();
  // crea il file per i log dentro la cartella logs
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('v0');
  const loggerService = app.get(LoggerService);
  loggerService.setServerInfo(`10.1.0.102:${port}`);
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  fileLogger.info(`Application running on port ${port}`);
}
bootstrap();

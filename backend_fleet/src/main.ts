import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { fileLogger } from './log/file-logger';

async function bootstrap(): Promise<void> {
  const port = 3001;

  const logger = new Logger();
  // crea il file per i log dentro la cartella logs
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('v0');
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  fileLogger.info(`Application running on port ${port}`);
}
bootstrap();

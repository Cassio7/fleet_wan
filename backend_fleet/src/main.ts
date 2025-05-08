import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { LoggerService } from './log/service/logger.service';
import { SchedulerRegistry } from '@nestjs/schedule';

async function bootstrap(): Promise<void> {
  const port = process.env.PORT;

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

  const schedulerRegistry = app.get(SchedulerRegistry);
  const enableCrons = process.env.ENABLE_CRON === 'true';
  if (!enableCrons) {
    // Rimuove tutti i cron registrati automaticamente
    logger.log('❌ CRON DISABILITATI');
    schedulerRegistry.getCronJobs().forEach((job, name) => {
      schedulerRegistry.deleteCronJob(name);
    });
  } else logger.log('✅ CRON ABILITATI');
}
bootstrap();

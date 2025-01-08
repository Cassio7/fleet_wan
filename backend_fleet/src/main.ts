import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();
  const port = 3001;
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('v0');
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}
bootstrap();

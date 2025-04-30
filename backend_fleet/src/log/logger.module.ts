import { Module } from '@nestjs/common';
import { LoggerService } from './service/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntity } from 'src/classes/entities/log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity], 'mainConnection')],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryEntity } from 'src/classes/entities/history.entity';
import { UserEntity } from 'src/classes/entities/user.entity';
import { VehicleEntity } from 'src/classes/entities/vehicle.entity';
import { SpeedController } from 'src/controllers/speed/speed.controller';
import { LoggerModule } from 'src/log/logger.module';
import { SpeedService } from 'src/services/speed/speed.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [HistoryEntity, VehicleEntity, UserEntity],
      'readOnlyConnection',
    ),
    AuthModule,
    LoggerModule,
  ],
  providers: [SpeedService],
  controllers: [SpeedController],
  exports: [SpeedService],
})
export class SpeedModule {}

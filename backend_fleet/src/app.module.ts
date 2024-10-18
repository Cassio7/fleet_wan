import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importa le entità
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { DeviceEntity } from 'classes/entities/device.entity';
import { GroupEntity } from 'classes/entities/group.entity';
import { VehicleGroupEntity } from 'classes/entities/vehicle_group.entity';
import { RealtimePositionEntity } from 'classes/entities/realtime_position.entity';
import { HistoryEntity } from 'classes/entities/history.entity';
import { TagEntity } from 'classes/entities/tag.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { DetectionTagEntity } from 'classes/entities/detection_tag.entity';
import { VehicleService } from './services/vehicle/vehicle.service';
import { GroupService } from './services/group/group.service';
import { GroupController } from './controllers/group/group.controller';
import { VehicleController } from './controllers/vehicle/vehicle.controller';
import { RealtimeService } from './services/realtime/realtime.service';
import { RealtimeController } from './controllers/realtime/realtime.controller';
import { HistoryService } from './services/history/history.service';
import { HistoryController } from './controllers/history/history.controller';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'mainConnection',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          VehicleEntity,
          DeviceEntity,
          GroupEntity,
          VehicleGroupEntity,
          RealtimePositionEntity,
          HistoryEntity,
          TagEntity,
          TagHistoryEntity,
          DetectionTagEntity,
        ],
        synchronize: true, // if true recreate db
        dropSchema: true,
      }),
    }),
    TypeOrmModule.forFeature(
      [
        VehicleEntity,
        DeviceEntity,
        GroupEntity,
        VehicleGroupEntity,
        RealtimePositionEntity,
        HistoryEntity,
        TagEntity,
        TagHistoryEntity,
        DetectionTagEntity,
      ],
      'mainConnection',
    ),
  ],

  controllers: [
    AppController,
    GroupController,
    VehicleController,
    RealtimeController,
    HistoryController,
  ],
  providers: [
    AppService,
    VehicleService,
    GroupService,
    RealtimeService,
    HistoryService,
  ],
})
export class AppModule {}

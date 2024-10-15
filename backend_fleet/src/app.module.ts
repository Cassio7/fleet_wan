import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importa le entità
import { Vehicle } from 'entities/vehicle.entity';
import { Device } from 'entities/device.entity';
import { Group } from 'entities/group.entity';
import { VehicleGroup } from 'entities/vehicle_group.entity';
import { RealtimePosition } from 'entities/realtime_position.entity';
import { History } from 'entities/history.entity';
import { Tag } from 'entities/tag.entity';
import { TagHistory } from 'entities/tag_history.entity';
import { DetectionTag } from 'entities/detection_tag.entity';
import { VehicleService } from './services/vehicle/vehicle.service';
import { GroupService } from './services/group/group.service';
import { GroupController } from './controllers/group/group.controller';
import { VehicleController } from './controllers/vehicle/vehicle.controller';
import { RealtimeService } from './services/realtime/realtime.service';
import { RealtimeController } from './controllers/realtime/realtime.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Vehicle,
          Device,
          Group,
          VehicleGroup,
          RealtimePosition,
          History,
          Tag,
          TagHistory,
          DetectionTag,
        ],
        synchronize: true, // if true recreate db
        //dropSchema: true,
      }),
    }),
    TypeOrmModule.forFeature([
      Vehicle,
      Device,
      Group,
      VehicleGroup,
      RealtimePosition,
      History,
      Tag,
      TagHistory,
      DetectionTag,
    ]),
  ],
  controllers: [AppController, GroupController, VehicleController, RealtimeController],
  providers: [AppService, VehicleService, GroupService, RealtimeService],
})
export class AppModule {}

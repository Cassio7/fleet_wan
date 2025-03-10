import { RedisModule } from '@nestjs-modules/ioredis';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importa le entità
import { AnomalyEntity } from 'classes/entities/anomaly.entity';
import { AssociationEntity } from 'classes/entities/association.entity';
import { CompanyEntity } from 'classes/entities/company.entity';
import { DetectionTagEntity } from 'classes/entities/detection_tag.entity';
import { DeviceEntity } from 'classes/entities/device.entity';
import { EquipmentEntity } from 'classes/entities/equipment.entity';
import { GroupEntity } from 'classes/entities/group.entity';
import { HistoryEntity } from 'classes/entities/history.entity';
import { NoteEntity } from 'classes/entities/note.entity';
import { RealtimePositionEntity } from 'classes/entities/realtime_position.entity';
import { RentalEntity } from 'classes/entities/rental.entity';
import { RoleEntity } from 'classes/entities/role.entity';
import { ServiceEntity } from 'classes/entities/service.entity';
import { SessionEntity } from 'classes/entities/session.entity';
import { TagEntity } from 'classes/entities/tag.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { WorksiteGroupEntity } from 'classes/entities/worksite_group.entity';
import { WorkzoneEntity } from 'classes/entities/workzone.entity';

// importo i servizi
import { LoggerService } from './log/service/logger.service';
import { AnomalyService } from './services/anomaly/anomaly.service';
import { AssociationService } from './services/association/association.service';
import { AuthService } from './services/auth/auth.service';
import { CompanyService } from './services/company/company.service';
import { GroupService } from './services/group/group.service';
import { NotesService } from './services/notes/notes.service';
import { RealtimeService } from './services/realtime/realtime.service';
import { RoleService } from './services/role/role.service';
import { SessionService } from './services/session/session.service';
import { TagService } from './services/tag/tag.service';
import { UserService } from './services/user/user.service';
import { VehicleService } from './services/vehicle/vehicle.service';
import { WorksiteService } from './services/worksite/worksite.service';

// importo i controller
import { AnomalyController } from './controllers/anomaly/anomaly.controller';
import { AssociationController } from './controllers/association/association.controller';
import { AuthController } from './controllers/auth/auth.controller';
import { CompanyController } from './controllers/company/company.controller';
import { GroupController } from './controllers/group/group.controller';
import { NotesController } from './controllers/notes/notes.controller';
import { RealtimeController } from './controllers/realtime/realtime.controller';
import { SessionController } from './controllers/session/session.controller';
import { TagController } from './controllers/tag/tag.controller';
import { UserController } from './controllers/user/user.controller';
import { VehicleController } from './controllers/vehicle/vehicle.controller';

// importo i factory
import { AssociationFactoryService } from './factory/association.factory';
import { CompanyFactoryService } from './factory/company.factory';
import { EquipmentFacotoryService } from './factory/equipment.factory';
import { GroupFactoryService } from './factory/group.factory';
import { RentalFactoryService } from './factory/rental.factory';
import { ServiceFactoryService } from './factory/service.factory';
import { UserFactoryService } from './factory/user.factory';
import { WorksiteFactoryService } from './factory/worksite.factory';
import { WorksiteGroupFactoryService } from './factory/worksite_group.factory';
import { WorkzoneFacotoryService } from './factory/workzone.factory';
import { ControlService } from './services/control/control.service';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationEntity } from 'classes/entities/notification.entity';
import { NotificationsController } from './notifications/notifications.controller';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
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
          RealtimePositionEntity,
          HistoryEntity,
          TagEntity,
          TagHistoryEntity,
          DetectionTagEntity,
          SessionEntity,
          UserEntity,
          RoleEntity,
          AssociationEntity,
          CompanyEntity,
          WorksiteEntity,
          WorksiteGroupEntity,
          NoteEntity,
          ServiceEntity,
          AnomalyEntity,
          WorkzoneEntity,
          RentalEntity,
          EquipmentEntity,
          NotificationEntity,
        ],
        synchronize: true,
        //dropSchema: true, // if true drop db
      }),
    }),
    TypeOrmModule.forFeature(
      [
        VehicleEntity,
        DeviceEntity,
        GroupEntity,
        RealtimePositionEntity,
        HistoryEntity,
        TagEntity,
        TagHistoryEntity,
        DetectionTagEntity,
        SessionEntity,
        UserEntity,
        RoleEntity,
        AssociationEntity,
        CompanyEntity,
        WorksiteEntity,
        WorksiteGroupEntity,
        NoteEntity,
        ServiceEntity,
        AnomalyEntity,
        WorkzoneEntity,
        RentalEntity,
        EquipmentEntity,
        NotificationEntity,
      ],
      'mainConnection',
    ),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'readOnlyConnection',
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
          RealtimePositionEntity,
          HistoryEntity,
          TagEntity,
          TagHistoryEntity,
          DetectionTagEntity,
          SessionEntity,
          UserEntity,
          RoleEntity,
          AssociationEntity,
          CompanyEntity,
          WorksiteEntity,
          WorksiteGroupEntity,
          NoteEntity,
          ServiceEntity,
          AnomalyEntity,
          WorkzoneEntity,
          RentalEntity,
          EquipmentEntity,
          NotificationEntity,
        ],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature(
      [
        VehicleEntity,
        DeviceEntity,
        GroupEntity,
        RealtimePositionEntity,
        HistoryEntity,
        TagEntity,
        TagHistoryEntity,
        DetectionTagEntity,
        SessionEntity,
        UserEntity,
        RoleEntity,
        AssociationEntity,
        CompanyEntity,
        WorksiteEntity,
        WorksiteGroupEntity,
        NoteEntity,
        ServiceEntity,
        AnomalyEntity,
        WorkzoneEntity,
        RentalEntity,
        EquipmentEntity,
        NotificationEntity,
      ],
      'readOnlyConnection',
    ),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SECRET_TOKEN'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL'),
      }),
    }),
  ],

  controllers: [
    AppController,
    GroupController,
    VehicleController,
    RealtimeController,
    SessionController,
    TagController,
    AuthController,
    UserController,
    CompanyController,
    NotesController,
    AnomalyController,
    AssociationController,
    NotificationsController,
  ],
  providers: [
    AppService,
    VehicleService,
    GroupService,
    RealtimeService,
    SessionService,
    TagService,
    AuthService,
    UserService,
    CompanyService,
    CompanyFactoryService,
    UserFactoryService,
    WorksiteFactoryService,
    GroupFactoryService,
    WorksiteGroupFactoryService,
    RentalFactoryService,
    NotesService,
    AssociationFactoryService,
    EquipmentFacotoryService,
    ServiceFactoryService,
    WorkzoneFacotoryService,
    AnomalyService,
    RoleService,
    AssociationService,
    WorksiteService,
    LoggerService,
    ControlService,
    NotificationsService,
    NotificationsGateway,
  ],
})
export class AppModule {}

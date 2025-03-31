import { RedisModule } from '@nestjs-modules/ioredis';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnomalyEntity } from 'classes/entities/anomaly.entity';
import { AssociationEntity } from 'classes/entities/association.entity';
import { CompanyEntity } from 'classes/entities/company.entity';
import { DetectionTagEntity } from 'classes/entities/detection_tag.entity';
import { DeviceEntity } from 'classes/entities/device.entity';
import { EquipmentEntity } from 'classes/entities/equipment.entity';
import { GroupEntity } from 'classes/entities/group.entity';
import { HistoryEntity } from 'classes/entities/history.entity';
import { NoteEntity } from 'classes/entities/note.entity';
import { NotificationEntity } from 'classes/entities/notification.entity';
import { RentalEntity } from 'classes/entities/rental.entity';
import { RoleEntity } from 'classes/entities/role.entity';
import { ServiceEntity } from 'classes/entities/service.entity';
import { SessionEntity } from 'classes/entities/session.entity';
import { TagEntity } from 'classes/entities/tag.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { WorksiteHistoryEntity } from 'classes/entities/worksite-history.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { WorkzoneEntity } from 'classes/entities/workzone.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnomalyController } from './controllers/anomaly/anomaly.controller';
import { AssociationController } from './controllers/association/association.controller';
import { AuthController } from './controllers/auth/auth.controller';
import { CompanyController } from './controllers/company/company.controller';
import { EquipmentController } from './controllers/equipment/equipment.controller';
import { GroupController } from './controllers/group/group.controller';
import { NotesController } from './controllers/notes/notes.controller';
import { RealtimeController } from './controllers/realtime/realtime.controller';
import { RentalController } from './controllers/rental/rental.controller';
import { ServiceController } from './controllers/service/service.controller';
import { SessionController } from './controllers/session/session.controller';
import { TagController } from './controllers/tag/tag.controller';
import { UserController } from './controllers/user/user.controller';
import { VehicleController } from './controllers/vehicle/vehicle.controller';
import { WorksiteHistoryController } from './controllers/worksite-history/worksite-history.controller';
import { WorksiteController } from './controllers/worksite/worksite.controller';
import { AssociationFactoryService } from './factory/association.factory';
import { CompanyFactoryService } from './factory/company.factory';
import { EquipmentFacotoryService } from './factory/equipment.factory';
import { GroupFactoryService } from './factory/group.factory';
import { RentalFactoryService } from './factory/rental.factory';
import { ServiceFactoryService } from './factory/service.factory';
import { UserFactoryService } from './factory/user.factory';
import { WorksiteFactoryService } from './factory/worksite.factory';
import { WorkzoneFacotoryService } from './factory/workzone.factory';
import { LoggerService } from './log/service/logger.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationsService } from './notifications/notifications.service';
import { AnomalyService } from './services/anomaly/anomaly.service';
import { StatsService } from './services/anomaly/stats/stats.service';
import { AssociationService } from './services/association/association.service';
import { AuthService } from './services/auth/auth.service';
import { CompanyService } from './services/company/company.service';
import { ControlService } from './services/control/control.service';
import { EquipmentService } from './services/equipment/equipment.service';
import { GroupService } from './services/group/group.service';
import { NotesService } from './services/notes/notes.service';
import { RealtimeService } from './services/realtime/realtime.service';
import { RentalService } from './services/rental/rental.service';
import { RoleService } from './services/role/role.service';
import { ServiceService } from './services/service/service.service';
import { SessionService } from './services/session/session.service';
import { TagService } from './services/tag/tag.service';
import { UserService } from './services/user/user.service';
import { VehicleService } from './services/vehicle/vehicle.service';
import { WorksiteHistoryService } from './services/worksite-history/worksite-history.service';
import { WorksiteService } from './services/worksite/worksite.service';
import { ExportService } from './services/tag/export/export.service';

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
          NoteEntity,
          ServiceEntity,
          AnomalyEntity,
          WorkzoneEntity,
          RentalEntity,
          EquipmentEntity,
          NotificationEntity,
          WorksiteHistoryEntity,
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
        NoteEntity,
        ServiceEntity,
        AnomalyEntity,
        WorkzoneEntity,
        RentalEntity,
        EquipmentEntity,
        NotificationEntity,
        WorksiteHistoryEntity,
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
          NoteEntity,
          ServiceEntity,
          AnomalyEntity,
          WorkzoneEntity,
          RentalEntity,
          EquipmentEntity,
          NotificationEntity,
          WorksiteHistoryEntity,
        ],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature(
      [
        VehicleEntity,
        DeviceEntity,
        GroupEntity,
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
        NoteEntity,
        ServiceEntity,
        AnomalyEntity,
        WorkzoneEntity,
        RentalEntity,
        EquipmentEntity,
        NotificationEntity,
        WorksiteHistoryEntity,
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
        config: {
          host: 'localhost',
          port: 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
        },
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
    WorksiteController,
    EquipmentController,
    RentalController,
    ServiceController,
    WorksiteHistoryController,
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
    StatsService,
    ServiceService,
    EquipmentService,
    RentalService,
    WorksiteHistoryService,
    ExportService,
  ],
})
export class AppModule {}

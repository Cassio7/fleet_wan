import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';

// Importa le entità
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { DeviceEntity } from 'classes/entities/device.entity';
import { GroupEntity } from 'classes/entities/group.entity';
import { RealtimePositionEntity } from 'classes/entities/realtime_position.entity';
import { HistoryEntity } from 'classes/entities/history.entity';
import { TagEntity } from 'classes/entities/tag.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { DetectionTagEntity } from 'classes/entities/detection_tag.entity';
import { SessionEntity } from 'classes/entities/session.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { RoleEntity } from 'classes/entities/role.entity';
import { UserRoleEntity } from 'classes/entities/user_role.entity';
import { CompanyEntity } from 'classes/entities/company.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { NoteEntity } from 'classes/entities/note.entity';
import { RoleCompanyEntity } from 'classes/entities/role_company.entity';

// importo i servizi
import { VehicleService } from './services/vehicle/vehicle.service';
import { GroupService } from './services/group/group.service';
import { RealtimeService } from './services/realtime/realtime.service';
import { SessionService } from './services/session/session.service';
import { TagService } from './services/tag/tag.service';
import { AuthService } from './services/auth/auth.service';
import { UserService } from './services/user/user.service';
import { CompanyService } from './services/company/company.service';

// importo i controller
import { GroupController } from './controllers/group/group.controller';
import { VehicleController } from './controllers/vehicle/vehicle.controller';
import { RealtimeController } from './controllers/realtime/realtime.controller';
import { SessionController } from './controllers/session/session.controller';
import { TagController } from './controllers/tag/tag.controller';
import { CompanyController } from './controllers/company/company.controller';
import { AuthController } from './controllers/auth/auth.controller';

// importo i factory
import { UserFactoryService } from './factory/user.factory';
import { CompanyFactoryService } from './factory/company.factory';
import { UserController } from './controllers/user/user.controller';
import { WorksiteFactoryService } from './factory/worksite.factory';
import { GroupFactoryService } from './factory/group.factory';
import { WorksiteGroupEntity } from 'classes/entities/worksite_group.entity';
import { WorksiteGroupFactoryService } from './factory/worksite_group.factory';
import { RoleCompanyFactoryService } from './factory/role_company.factory';

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
          UserRoleEntity,
          CompanyEntity,
          WorksiteEntity,
          WorksiteGroupEntity,
          NoteEntity,
          RoleCompanyEntity,
        ],
        synchronize: true,
        dropSchema: true, // if true drop db
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
        UserRoleEntity,
        CompanyEntity,
        WorksiteEntity,
        WorksiteGroupEntity,
        NoteEntity,
        RoleCompanyEntity,
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
          UserRoleEntity,
          CompanyEntity,
          WorksiteEntity,
          WorksiteGroupEntity,
          NoteEntity,
          RoleCompanyEntity,
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
        UserRoleEntity,
        CompanyEntity,
        WorksiteEntity,
        WorksiteGroupEntity,
        NoteEntity,
        RoleCompanyEntity,
      ],
      'readOnlyConnection',
    ),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SECRET_TOKEN'),
        signOptions: { expiresIn: '10h' },
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
    RoleCompanyFactoryService,
  ],
})
export class AppModule {}

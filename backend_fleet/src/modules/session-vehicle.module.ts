import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionVehicleService } from 'src/services/session-vehicle/session-vehicle.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'viewConnection',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [],
        synchronize: false,
        extra: {
          application_name: `backend-${configService.get<number>('PORT')}-viewConnection`,
        },
      }),
    }),
  ],
  providers: [SessionVehicleService],
  exports: [SessionVehicleService],
})
export class SessionVehicleModule {}

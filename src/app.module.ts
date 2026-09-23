import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { appConfig, databaseConfig } from './config/configuration.js';
import { validateEnv } from './config/env.schema.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig],
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}

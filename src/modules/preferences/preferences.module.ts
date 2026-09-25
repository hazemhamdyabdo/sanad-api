import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPreferences } from './entities/job-preferences.entity.js';
import { PreferencesController } from './preferences.controller.js';
import { PreferencesRepository } from './preferences.repository.js';
import { PreferencesService } from './preferences.service.js';

/** The device's job preferences (`PUT /preferences`) — read by job matching as its pre-search filters. */
@Module({
  imports: [TypeOrmModule.forFeature([JobPreferences])],
  controllers: [PreferencesController],
  providers: [PreferencesService, PreferencesRepository],
  exports: [PreferencesService],
})
export class PreferencesModule {}

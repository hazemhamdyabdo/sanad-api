import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationModule } from '../conversation/index.js';
import { CvModule } from '../cv/index.js';
import { DeviceController } from './device.controller.js';
import { DeviceRepository } from './device.repository.js';
import { DeviceService } from './device.service.js';
import { Device } from './entities/device.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Device]), ConversationModule, CvModule],
  controllers: [DeviceController],
  providers: [DeviceService, DeviceRepository],
  exports: [DeviceService],
})
export class DeviceModule {}

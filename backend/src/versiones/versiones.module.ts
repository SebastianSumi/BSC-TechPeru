import { Module } from '@nestjs/common';
import { VersionesController } from './versiones.controller.js';
import { VersionesService } from './versiones.service.js';

@Module({
  controllers: [VersionesController],
  providers: [VersionesService],
})
export class VersionesModule {}

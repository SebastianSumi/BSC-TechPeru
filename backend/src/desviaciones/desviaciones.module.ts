import { Module } from '@nestjs/common';
import { DesviacionesController } from './desviaciones.controller.js';
import { DesviacionesService } from './desviaciones.service.js';

@Module({
  controllers: [DesviacionesController],
  providers: [DesviacionesService],
})
export class DesviacionesModule {}

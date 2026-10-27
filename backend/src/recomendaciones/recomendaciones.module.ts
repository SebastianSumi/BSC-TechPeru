import { Module } from '@nestjs/common';
import { RecomendacionesController } from './recomendaciones.controller.js';
import { RecomendacionesService } from './recomendaciones.service.js';

@Module({
  controllers: [RecomendacionesController],
  providers: [RecomendacionesService],
})
export class RecomendacionesModule {}

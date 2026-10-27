import { Module } from '@nestjs/common';
import { EvidenciasController } from './evidencias.controller.js';
import { EvidenciasService } from './evidencias.service.js';
import { AlmacenamientoService } from './almacenamiento.service.js';

@Module({
  controllers: [EvidenciasController],
  providers: [EvidenciasService, AlmacenamientoService],
})
export class EvidenciasModule {}

import { Module } from '@nestjs/common';
import { CompromisosController } from './compromisos.controller.js';
import { CompromisosService } from './compromisos.service.js';

@Module({
  controllers: [CompromisosController],
  providers: [CompromisosService],
})
export class CompromisosModule {}

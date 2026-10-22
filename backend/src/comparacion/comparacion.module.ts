import { Module } from '@nestjs/common';
import { ComparacionController } from './comparacion.controller.js';
import { ComparacionService } from './comparacion.service.js';

@Module({
  controllers: [ComparacionController],
  providers: [ComparacionService],
})
export class ComparacionModule {}

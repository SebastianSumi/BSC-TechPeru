import { Module } from '@nestjs/common';
import { CalendarioController } from './calendario.controller.js';
import { CalendarioService } from './calendario.service.js';

@Module({
  controllers: [CalendarioController],
  providers: [CalendarioService],
})
export class CalendarioModule {}

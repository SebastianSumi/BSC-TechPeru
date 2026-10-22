import { Module } from '@nestjs/common';
import { IniciativasController } from './iniciativas.controller.js';
import { IniciativasService } from './iniciativas.service.js';

@Module({
  controllers: [IniciativasController],
  providers: [IniciativasService],
})
export class IniciativasModule {}

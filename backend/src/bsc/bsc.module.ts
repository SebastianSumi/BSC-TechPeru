import { Module } from '@nestjs/common';
import { BscController } from './bsc.controller.js';
import { BscService } from './bsc.service.js';

@Module({
  controllers: [BscController],
  providers: [BscService],
})
export class BscModule {}

import { Global, Module } from '@nestjs/common';
import { AccesoService } from './acceso.service.js';

@Global()
@Module({
  providers: [AccesoService],
  exports: [AccesoService],
})
export class ComunModule {}

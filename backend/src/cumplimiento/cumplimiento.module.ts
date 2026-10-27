import { Global, Module } from '@nestjs/common';
import { CumplimientoService } from './cumplimiento.service.js';

@Global()
@Module({
  providers: [CumplimientoService],
  exports: [CumplimientoService],
})
export class CumplimientoModule {}

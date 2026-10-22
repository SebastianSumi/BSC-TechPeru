import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { BscModule } from './bsc/bsc.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PeriodosModule } from './periodos/periodos.module.js';
import { AsignacionesModule } from './asignaciones/asignaciones.module.js';
import { JwtAuthGuard, RolesGuard } from './auth/guards.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BscModule,
    PeriodosModule,
    AsignacionesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

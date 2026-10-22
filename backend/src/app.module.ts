import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { BscModule } from './bsc/bsc.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PeriodosModule } from './periodos/periodos.module.js';
import { AsignacionesModule } from './asignaciones/asignaciones.module.js';
import { AuditoriaModule } from './auditoria/auditoria.module.js';
import { ConfigModule } from './config/config.module.js';
import { ObjetivosModule } from './objetivos/objetivos.module.js';
import { IndicadoresModule } from './indicadores/indicadores.module.js';
import { IniciativasModule } from './iniciativas/iniciativas.module.js';
import { AlertasModule } from './alertas/alertas.module.js';
import { DesviacionesModule } from './desviaciones/desviaciones.module.js';
import { EvidenciasModule } from './evidencias/evidencias.module.js';
import { CompromisosModule } from './compromisos/compromisos.module.js';
import { VersionesModule } from './versiones/versiones.module.js';
import { CalendarioModule } from './calendario/calendario.module.js';
import { MapaModule } from './mapa/mapa.module.js';
import { ComparacionModule } from './comparacion/comparacion.module.js';
import { ImportacionModule } from './importacion/importacion.module.js';
import { AprobacionesModule } from './aprobaciones/aprobaciones.module.js';
import { JwtAuthGuard, RolesGuard } from './auth/guards.js';

@Module({
  imports: [
    PrismaModule,
    AuditoriaModule,
    AuthModule,
    BscModule,
    PeriodosModule,
    AsignacionesModule,
    ConfigModule,
    ObjetivosModule,
    IndicadoresModule,
    IniciativasModule,
    AlertasModule,
    DesviacionesModule,
    EvidenciasModule,
    CompromisosModule,
    VersionesModule,
    CalendarioModule,
    MapaModule,
    ComparacionModule,
    ImportacionModule,
    AprobacionesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

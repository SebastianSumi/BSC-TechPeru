import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BscService } from './bsc.service.js';
import { UpsertMedicionDto } from './bsc.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolNombre } from '../auth/roles.constants.js';
import { Roles } from '../auth/decorators.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BscController {
  constructor(private readonly bsc: BscService) {}

  @Get('perspectivas')
  getPerspectivas() {
    return this.bsc.getPerspectivas();
  }

  @Get('kpis')
  getKpis(
    @Query('perspectiva') perspectiva?: string,
    @Query('periodo') periodoId?: string,
  ) {
    return this.bsc.getKpis(perspectiva, periodoId);
  }

  @Get('kpis/:id')
  getKpi(@Param('id') id: string, @Query('periodo') periodoId?: string) {
    return this.bsc.getKpi(id, periodoId);
  }

  @Get('kpis/:id/mediciones')
  getMediciones(@Param('id') id: string) {
    return this.bsc.getMediciones(id);
  }

  @Post('kpis/:id/mediciones')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  upsertMedicion(@Param('id') id: string, @Body() dto: UpsertMedicionDto) {
    return this.bsc.upsertMedicion(id, dto);
  }

  @Get('resumen')
  getResumen(@Query('periodo') periodoId?: string) {
    return this.bsc.getResumen(periodoId);
  }

  @Patch('kpis/:id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  setReal(@Param('id') id: string, @Body('real') real: number) {
    return this.bsc.setReal(id, Number(real));
  }

  @Get('reportes')
  reporte(
    @Query('perspectiva') perspectivaId?: string,
    @Query('periodo') periodoId?: string,
    @Query('usuario') usuarioId?: string,
    @CurrentUser() user?: { id: string; rol: RolNombre },
  ) {
    const esResponsable = user?.rol === RolNombre.RESPONSABLE;
    return this.bsc.reporte({
      perspectivaId,
      periodoId,
      usuarioId: esResponsable ? user!.id : usuarioId,
    });
  }
}

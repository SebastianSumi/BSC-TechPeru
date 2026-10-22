import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AprobacionesService } from './aprobaciones.service.js';
import { ResolverAprobacionDto } from './aprobaciones.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('aprobaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AprobacionesController {
  constructor(private readonly aprobaciones: AprobacionesService) {}

  @Get('pendientes')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  pendientes() {
    return this.aprobaciones.pendientes();
  }

  @Get('historial/:medicionId')
  historial(@Param('medicionId') medicionId: string) {
    return this.aprobaciones.historial(medicionId);
  }

  @Post(':medicionId/solicitar')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  solicitar(
    @Param('medicionId') medicionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.aprobaciones.solicitarAprobacion(medicionId, user.id);
  }

  @Post(':medicionId/aprobar')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  aprobar(
    @Param('medicionId') medicionId: string,
    @Body() dto: ResolverAprobacionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.aprobaciones.aprobar(medicionId, dto, user.id);
  }

  @Post(':medicionId/rechazar')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  rechazar(
    @Param('medicionId') medicionId: string,
    @Body() dto: ResolverAprobacionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.aprobaciones.rechazar(medicionId, dto, user.id);
  }
}

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
import { AlertasService } from './alertas.service.js';
import { CreateAlertaDto, UpdateAlertaDto } from './alertas.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('alertas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertasController {
  constructor(private readonly alertas: AlertasService) {}

  @Get()
  listar(
    @Query('estado') estado?: string,
    @Query('destinatario') destinatarioId?: string,
    @Query('empresa') empresaId?: string,
    @CurrentUser() user?: { id: string; rol: RolNombre },
  ) {
    const esResponsable = user?.rol === RolNombre.RESPONSABLE;
    return this.alertas.listar({
      estado,
      destinatarioId: esResponsable ? user!.id : destinatarioId,
      empresaId,
    });
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crear(
    @Body() dto: CreateAlertaDto,
    @CurrentUser() user: { id: string },
    @Query('empresa') empresaId?: string,
  ) {
    return this.alertas.crear(dto, user.id, empresaId);
  }

  @Post('generar')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  generar(
    @Query('periodo') periodoId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.alertas.generarParaPeriodo(periodoId, user.id);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: UpdateAlertaDto) {
    return this.alertas.actualizar(id, dto);
  }
}

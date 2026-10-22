import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DesviacionesService } from './desviaciones.service.js';
import {
  CreateDesviacionDto,
  UpdateDesviacionDto,
} from './desviaciones.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('desviaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DesviacionesController {
  constructor(private readonly desviaciones: DesviacionesService) {}

  @Get()
  listar(@Query('kpi') kpiId?: string, @Query('estado') estado?: string) {
    return this.desviaciones.listar({ kpiId, estado });
  }

  @Post()
  @Roles(
    RolNombre.ADMIN,
    RolNombre.GERENTE,
    RolNombre.ANALISTA,
    RolNombre.RESPONSABLE,
  )
  crear(@Body() dto: CreateDesviacionDto, @CurrentUser() user: { id: string }) {
    return this.desviaciones.crear(dto, user.id);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateDesviacionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.desviaciones.actualizar(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  eliminar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.desviaciones.eliminar(id, user.id);
  }
}

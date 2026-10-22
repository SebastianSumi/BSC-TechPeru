import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PeriodosService } from './periodos.service.js';
import { CreatePeriodoDto, UpdatePeriodoDto } from './periodos.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';

@Controller('periodos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodosController {
  constructor(private readonly periodos: PeriodosService) {}

  @Get()
  listar() {
    return this.periodos.listar();
  }

  @Get('activo')
  activo() {
    return this.periodos.activo();
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crear(@Body() dto: CreatePeriodoDto) {
    return this.periodos.crear(dto);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  actualizar(@Param('id') id: string, @Body() dto: UpdatePeriodoDto) {
    return this.periodos.actualizar(id, dto);
  }

  @Patch(':id/activar')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  activar(@Param('id') id: string) {
    return this.periodos.activar(id);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN)
  eliminar(@Param('id') id: string) {
    return this.periodos.eliminar(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AsignacionesService } from './asignaciones.service.js';
import { CreateAsignacionDto } from './asignaciones.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('asignaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsignacionesController {
  constructor(private readonly asignaciones: AsignacionesService) {}

  @Get()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  listar(@Query('empresa') empresaId?: string) {
    return this.asignaciones.listar(empresaId);
  }

  @Get('mias')
  mias(
    @CurrentUser() user: { id: string },
    @Query('empresa') empresaId?: string,
  ) {
    return this.asignaciones.porUsuario(user.id, empresaId);
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crear(@Body() dto: CreateAsignacionDto) {
    return this.asignaciones.crear(dto);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  eliminar(@Param('id') id: string) {
    return this.asignaciones.eliminar(id);
  }
}

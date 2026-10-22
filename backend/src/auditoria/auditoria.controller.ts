import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  listar(
    @Query('entidad') entidad?: string,
    @Query('usuario') usuarioId?: string,
    @Query('limite') limite?: string,
  ) {
    return this.auditoria.listar({
      entidad,
      usuarioId,
      limite: limite ? Number(limite) : undefined,
    });
  }
}

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
import { CompromisosService } from './compromisos.service.js';
import {
  CreateCompromisoDto,
  UpdateCompromisoDto,
} from './compromisos.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('compromisos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompromisosController {
  constructor(private readonly compromisos: CompromisosService) {}

  @Get()
  listar(
    @Query('estado') estado?: string,
    @Query('responsable') responsableId?: string,
    @Query('empresa') empresaId?: string,
  ) {
    return this.compromisos.listar({ estado, responsableId, empresaId });
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  crear(@Body() dto: CreateCompromisoDto, @CurrentUser() user: { id: string }) {
    return this.compromisos.crear(dto, user.id);
  }

  @Patch(':id')
  @Roles(
    RolNombre.ADMIN,
    RolNombre.GERENTE,
    RolNombre.ANALISTA,
    RolNombre.RESPONSABLE,
  )
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateCompromisoDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.compromisos.actualizar(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  eliminar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.compromisos.eliminar(id, user.id);
  }
}

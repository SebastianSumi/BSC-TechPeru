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
import { IndicadoresService } from './indicadores.service.js';
import {
  CreateIndicadorDto,
  UpdateIndicadorDto,
} from './indicadores.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('indicadores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndicadoresController {
  constructor(private readonly indicadores: IndicadoresService) {}

  @Get('diccionario')
  diccionario(
    @Query('perspectiva') perspectivaId?: string,
    @Query('periodo') periodoId?: string,
    @Query('empresa') empresaId?: string,
  ) {
    return this.indicadores.diccionario(perspectivaId, periodoId, empresaId);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.indicadores.obtener(id);
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crear(
    @Body() dto: CreateIndicadorDto,
    @CurrentUser() user: { id: string },
    @Query('empresa') empresaId?: string,
  ) {
    return this.indicadores.crear(dto, user.id, empresaId);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateIndicadorDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.indicadores.actualizar(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  desactivar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.indicadores.desactivar(id, user.id);
  }
}

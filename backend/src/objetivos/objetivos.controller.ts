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
import { ObjetivosService } from './objetivos.service.js';
import { CreateObjetivoDto, UpdateObjetivoDto } from './objetivos.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('objetivos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObjetivosController {
  constructor(private readonly objetivos: ObjetivosService) {}

  @Get()
  listar(
    @Query('perspectiva') perspectivaId?: string,
    @Query('incluirInactivos') incluirInactivos?: string,
    @Query('empresa') empresaId?: string,
  ) {
    return this.objetivos.listar(
      perspectivaId,
      incluirInactivos === 'true',
      empresaId,
    );
  }

  @Get('agrupados')
  agrupados(
    @Query('empresa') empresaId?: string,
    @Query('incluirInactivos') incluirInactivos?: string,
  ) {
    return this.objetivos.agrupados(empresaId, incluirInactivos === 'true');
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.objetivos.obtener(id);
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crear(
    @Body() dto: CreateObjetivoDto,
    @CurrentUser() user: { id: string },
    @Query('empresa') empresaId?: string,
  ) {
    return this.objetivos.crear(dto, user.id, empresaId);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.RESPONSABLE)
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateObjetivoDto,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.objetivos.actualizar(id, dto, user);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.RESPONSABLE)
  desactivar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.objetivos.desactivar(id, user);
  }
}

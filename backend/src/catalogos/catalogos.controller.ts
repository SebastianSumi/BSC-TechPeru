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
import { CatalogosService } from './catalogos.service.js';
import { CreateCatalogoDto, UpdateCatalogoDto } from './catalogos.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('catalogos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogosController {
  constructor(private readonly catalogos: CatalogosService) {}

  @Get()
  listar(
    @Query('empresa') empresaId?: string,
    @Query('incluirInactivos') incluirInactivos?: string,
  ) {
    return this.catalogos.listar(empresaId, incluirInactivos === 'true');
  }

  @Get(':id')
  obtener(@Param('id') id: string, @Query('empresa') empresaId?: string) {
    return this.catalogos.obtener(id, empresaId);
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crear(
    @Body() dto: CreateCatalogoDto,
    @CurrentUser() user: { id: string },
    @Query('empresa') empresaId?: string,
  ) {
    return this.catalogos.crear(dto, empresaId, user.id);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateCatalogoDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.catalogos.actualizar(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  desactivar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.catalogos.desactivar(id, user.id);
  }
}

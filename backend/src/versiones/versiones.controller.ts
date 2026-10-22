import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VersionesService } from './versiones.service.js';
import { CreateVersionDto } from './versiones.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('versiones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VersionesController {
  constructor(private readonly versiones: VersionesService) {}

  @Get()
  listar() {
    return this.versiones.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.versiones.obtener(id);
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crear(@Body() dto: CreateVersionDto, @CurrentUser() user: { id: string }) {
    return this.versiones.crear(dto, user.id);
  }

  @Patch(':id/publicar')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  publicar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.versiones.publicar(id, user.id);
  }

  @Patch(':id/archivar')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  archivar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.versiones.archivar(id, user.id);
  }
}

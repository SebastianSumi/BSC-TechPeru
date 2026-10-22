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
import { MapaService } from './mapa.service.js';
import { CreateRelacionDto } from './mapa.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('mapa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MapaController {
  constructor(private readonly mapa: MapaService) {}

  @Get()
  obtener(@Query('periodo') periodoId?: string) {
    return this.mapa.obtener(periodoId);
  }

  @Post('relaciones')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crearRelacion(
    @Body() dto: CreateRelacionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.mapa.crearRelacion(dto, user.id);
  }

  @Delete('relaciones/:id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  eliminarRelacion(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.mapa.eliminarRelacion(id, user.id);
  }
}

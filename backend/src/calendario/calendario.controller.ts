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
import { CalendarioService } from './calendario.service.js';
import { CreateEventoDto, UpdateEventoDto } from './calendario.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('calendario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarioController {
  constructor(private readonly calendario: CalendarioService) {}

  @Get()
  listar(@Query('periodo') periodoId?: string) {
    return this.calendario.listar(periodoId);
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  crear(@Body() dto: CreateEventoDto, @CurrentUser() user: { id: string }) {
    return this.calendario.crear(dto, user.id);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateEventoDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.calendario.actualizar(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  eliminar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.calendario.eliminar(id, user.id);
  }
}

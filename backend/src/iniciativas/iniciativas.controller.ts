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
import { IniciativasService } from './iniciativas.service.js';
import {
  CreateIniciativaDto,
  UpdateIniciativaDto,
} from './iniciativas.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('iniciativas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IniciativasController {
  constructor(private readonly iniciativas: IniciativasService) {}

  @Get()
  listar(
    @Query('objetivo') objetivoId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.iniciativas.listar({ objetivoId, estado });
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.iniciativas.obtener(id);
  }

  @Post()
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  crear(@Body() dto: CreateIniciativaDto, @CurrentUser() user: { id: string }) {
    return this.iniciativas.crear(dto, user.id);
  }

  @Patch(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateIniciativaDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.iniciativas.actualizar(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  eliminar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.iniciativas.eliminar(id, user.id);
  }
}

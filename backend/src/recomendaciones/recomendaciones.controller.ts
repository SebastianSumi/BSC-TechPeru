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
import { RecomendacionesService } from './recomendaciones.service.js';
import {
  CreateRecomendacionDto,
  UpdateRecomendacionDto,
} from './recomendaciones.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('recomendaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecomendacionesController {
  constructor(private readonly recomendaciones: RecomendacionesService) {}

  @Get()
  listar(
    @Query('objetivo') objetivoId?: string,
    @Query('kpi') kpiId?: string,
    @Query('empresa') empresaId?: string,
    @Query('soloFijadas') soloFijadas?: string,
  ) {
    return this.recomendaciones.listar({
      objetivoId,
      kpiId,
      empresaId,
      soloFijadas: soloFijadas === 'true',
    });
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.recomendaciones.obtener(id);
  }

  @Post()
  crear(
    @Body() dto: CreateRecomendacionDto,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.recomendaciones.crear(dto, user);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateRecomendacionDto,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.recomendaciones.actualizar(id, dto, user);
  }

  @Patch(':id/fijar')
  fijar(
    @Param('id') id: string,
    @Body('fijada') fijada: boolean,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.recomendaciones.fijar(id, fijada !== false, user);
  }

  @Delete(':id')
  eliminar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.recomendaciones.eliminar(id, user);
  }
}

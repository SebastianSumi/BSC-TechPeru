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
import { EvidenciasService } from './evidencias.service.js';
import { CreateEvidenciaDto } from './evidencias.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('evidencias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenciasController {
  constructor(private readonly evidencias: EvidenciasService) {}

  @Get()
  listar(
    @Query('kpi') kpiId?: string,
    @Query('medicion') medicionId?: string,
    @Query('desviacion') desviacionId?: string,
  ) {
    return this.evidencias.listar({ kpiId, medicionId, desviacionId });
  }

  @Post()
  crear(@Body() dto: CreateEvidenciaDto, @CurrentUser() user: { id: string }) {
    return this.evidencias.crear(dto, user.id);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.evidencias.eliminar(id, user.id);
  }
}

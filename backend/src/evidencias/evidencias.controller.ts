import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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
    @Query('tarea') tareaId?: string,
    @Query('resultado') resultadoTareaId?: string,
    @Query('empresa') empresaId?: string,
  ) {
    return this.evidencias.listar({
      kpiId,
      medicionId,
      desviacionId,
      tareaId,
      resultadoTareaId,
      empresaId,
    });
  }

  @Get(':id/descargar')
  async descargar(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const archivo = await this.evidencias.archivo(id);
    res.set({
      'Content-Type': archivo.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(archivo.nombreArchivo)}"`,
    });
    return new StreamableFile(archivo.contenido);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.evidencias.obtener(id);
  }

  @Post()
  crear(
    @Body() dto: CreateEvidenciaDto,
    @CurrentUser() user: { id: string; rol: string },
    @Query('empresa') empresaId?: string,
  ) {
    return this.evidencias.crear(dto, user, empresaId ?? 'techperu');
  }

  @Delete(':id')
  eliminar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.evidencias.eliminar(id, user);
  }
}

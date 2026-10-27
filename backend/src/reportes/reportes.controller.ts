import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AccesoService } from '../comun/acceso.service.js';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(
    private readonly reportes: ReportesService,
    private readonly acceso: AccesoService,
  ) {}

  private filtros(
    user: { id: string; rol: string },
    empresaId?: string,
    perspectivaId?: string,
    responsableId?: string,
    periodoId?: string,
    estado?: string,
  ) {
    return {
      empresaId,
      perspectivaId,
      responsableId,
      periodoId,
      estado,
      usuarioId: this.acceso.esGestorGlobal(user) ? undefined : user.id,
    };
  }

  @Get('objetivos')
  objetivos(
    @CurrentUser() user: { id: string; rol: string },
    @Query('empresa') empresaId?: string,
    @Query('perspectiva') perspectivaId?: string,
    @Query('responsable') responsableId?: string,
    @Query('periodo') periodoId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.reportes.reporteObjetivos(
      this.filtros(
        user,
        empresaId,
        perspectivaId,
        responsableId,
        periodoId,
        estado,
      ),
    );
  }

  @Get('objetivos/exportar')
  async exportar(
    @CurrentUser() user: { id: string; rol: string },
    @Res({ passthrough: true }) res: Response,
    @Query('empresa') empresaId?: string,
    @Query('perspectiva') perspectivaId?: string,
    @Query('responsable') responsableId?: string,
    @Query('periodo') periodoId?: string,
    @Query('estado') estado?: string,
  ) {
    const archivo = await this.reportes.exportarCsv(
      this.filtros(
        user,
        empresaId,
        perspectivaId,
        responsableId,
        periodoId,
        estado,
      ),
    );
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${archivo.nombreArchivo}"`,
    });
    return new StreamableFile(Buffer.from(archivo.contenido, 'utf8'));
  }

  @Get('objetivos/:id')
  detalle(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; rol: string },
    @Query('empresa') empresaId?: string,
    @Query('perspectiva') perspectivaId?: string,
    @Query('responsable') responsableId?: string,
    @Query('periodo') periodoId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.reportes.detalleObjetivo(
      id,
      this.filtros(
        user,
        empresaId,
        perspectivaId,
        responsableId,
        periodoId,
        estado,
      ),
    );
  }
}

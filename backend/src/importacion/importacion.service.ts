import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { ImportarMedicionesDto } from './importacion.dto.js';

interface FilaImport {
  kpiId: string;
  meta: number;
  real: number;
  nota?: string;
}

@Injectable()
export class ImportacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * Parsea un CSV con encabezado: kpiId,meta,real[,nota]
   * Valida formato y existencia del KPI antes de incorporar (RN-12).
   */
  private parseCsv(csv: string): FilaImport[] {
    const lineas = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lineas.length < 2) {
      throw new BadRequestException('El CSV no contiene filas de datos');
    }
    const cabecera = lineas[0].split(',').map((c) => c.trim().toLowerCase());
    const idxKpi = cabecera.indexOf('kpiid');
    const idxMeta = cabecera.indexOf('meta');
    const idxReal = cabecera.indexOf('real');
    const idxNota = cabecera.indexOf('nota');
    if (idxKpi === -1 || idxMeta === -1 || idxReal === -1) {
      throw new BadRequestException(
        'El CSV debe tener las columnas: kpiId, meta, real',
      );
    }
    return lineas.slice(1).map((linea, i) => {
      const cols = linea.split(',').map((c) => c.trim());
      const meta = Number(cols[idxMeta]);
      const real = Number(cols[idxReal]);
      if (!cols[idxKpi]) {
        throw new BadRequestException(`Fila ${i + 2}: kpiId vacío`);
      }
      if (Number.isNaN(meta) || Number.isNaN(real)) {
        throw new BadRequestException(
          `Fila ${i + 2}: meta/real deben ser numéricos`,
        );
      }
      return {
        kpiId: cols[idxKpi],
        meta,
        real,
        nota: idxNota !== -1 ? cols[idxNota] : undefined,
      };
    });
  }

  async importarMediciones(dto: ImportarMedicionesDto, usuarioId?: string) {
    const periodo = await this.prisma.periodo.findUnique({
      where: { id: dto.periodoId },
    });
    if (!periodo) throw new BadRequestException('Período inexistente');

    const filas = dto.filas ?? (dto.csv ? this.parseCsv(dto.csv) : []);
    if (filas.length === 0) {
      throw new BadRequestException('No hay filas para importar');
    }

    const errores: { fila: number; mensaje: string }[] = [];
    let importadas = 0;

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const kpi = await this.prisma.kpi.findUnique({
        where: { id: fila.kpiId },
      });
      if (!kpi) {
        errores.push({ fila: i + 1, mensaje: `KPI ${fila.kpiId} no existe` });
        continue;
      }
      await this.prisma.medicion.upsert({
        where: {
          kpiId_periodoId: { kpiId: fila.kpiId, periodoId: dto.periodoId },
        },
        update: {
          meta: fila.meta,
          real: fila.real,
          nota: fila.nota,
          registradoPorId: usuarioId,
        },
        create: {
          kpiId: fila.kpiId,
          periodoId: dto.periodoId,
          meta: fila.meta,
          real: fila.real,
          nota: fila.nota,
          registradoPorId: usuarioId,
        },
      });
      importadas++;
    }

    await this.auditoria.registrar({
      usuarioId,
      accion: 'IMPORTAR',
      entidad: 'Medicion',
      entidadId: dto.periodoId,
      detalle: { importadas, errores: errores.length },
    });

    return {
      periodo: periodo.nombre,
      totalFilas: filas.length,
      importadas,
      errores,
    };
  }
}

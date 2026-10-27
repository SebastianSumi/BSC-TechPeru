import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CreateAlertaDto, UpdateAlertaDto } from './alertas.dto.js';

@Injectable()
export class AlertasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(filtros: {
    estado?: string;
    destinatarioId?: string;
    empresaId?: string;
  } = {}) {
    return this.prisma.alerta.findMany({
      where: {
        ...(filtros.estado ? { estado: filtros.estado as never } : {}),
        ...(filtros.destinatarioId
          ? { destinatarioId: filtros.destinatarioId }
          : {}),
        ...(filtros.empresaId ? { empresaId: filtros.empresaId } : {}),
      },
      include: {
        kpi: { select: { id: true, nombre: true } },
        destinatario: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async crear(
    dto: CreateAlertaDto,
    usuarioId?: string,
    empresaId = 'techperu',
  ) {
    let empresa = empresaId;
    if (dto.kpiId) {
      const kpi = await this.prisma.kpi.findUnique({
        where: { id: dto.kpiId },
        select: { empresaId: true },
      });
      if (kpi) empresa = kpi.empresaId;
    }
    const alerta = await this.prisma.alerta.create({
      data: {
        empresaId: empresa,
        kpiId: dto.kpiId,
        tipo: dto.tipo ?? 'MANUAL',
        severidad: (dto.severidad ?? 'ADVERTENCIA') as never,
        mensaje: dto.mensaje,
        destinatarioId: dto.destinatarioId,
      },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Alerta',
      entidadId: alerta.id,
      detalle: { mensaje: dto.mensaje },
    });
    return alerta;
  }

  async actualizar(id: string, dto: UpdateAlertaDto) {
    const alerta = await this.prisma.alerta.findUnique({ where: { id } });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');
    return this.prisma.alerta.update({
      where: { id },
      data: {
        ...(dto.estado ? { estado: dto.estado as never } : {}),
        ...(dto.leida !== undefined ? { leida: dto.leida } : {}),
        ...(dto.estado === 'RESUELTA' || dto.estado === 'DESCARTADA'
          ? { resueltaEn: new Date() }
          : {}),
      },
    });
  }

  /**
   * Genera alertas para todos los KPIs críticos del período según la configuración.
   * Evita duplicados por (kpiId + tipo + estado NUEVA/RECONOCIDA).
   */
  async generarParaPeriodo(periodoId: string, usuarioId?: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: 'global' },
    });
    if (config && !config.notificarCriticos) return { generadas: 0 };

    const periodo = await this.prisma.periodo.findUnique({
      where: { id: periodoId },
      select: { empresaId: true },
    });
    const empresaId = periodo?.empresaId ?? 'techperu';

    const kpis = await this.prisma.kpi.findMany({
      where: { activo: true, empresaId },
      include: { mediciones: { where: { periodoId } } },
    });

    let generadas = 0;
    for (const k of kpis) {
      const med = k.mediciones[0];
      const meta = med?.meta ?? k.meta;
      const real = med?.real ?? k.real;
      if (real === 0) continue;
      const pct = k.inverso ? (meta / real) * 100 : (real / meta) * 100;
      const cumplimiento = Math.round(pct * 10) / 10;
      const uAlerta = k.umbralAlerta || config?.umbralAlerta || 75;
      if (cumplimiento >= uAlerta) continue;

      const existente = await this.prisma.alerta.findFirst({
        where: {
          kpiId: k.id,
          tipo: 'KPI_CRITICO',
          estado: { in: ['NUEVA', 'RECONOCIDA'] },
        },
      });
      if (existente) continue;

      await this.prisma.alerta.create({
        data: {
          empresaId,
          kpiId: k.id,
          tipo: 'KPI_CRITICO',
          severidad: cumplimiento < 60 ? 'CRITICA' : 'ADVERTENCIA',
          mensaje: `[${periodoId}] ${k.nombre}: cumplimiento ${cumplimiento}% por debajo del umbral de alerta (${uAlerta}%).`,
        },
      });
      generadas++;
    }
  }
}

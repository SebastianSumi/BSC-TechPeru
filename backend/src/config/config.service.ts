import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';

export interface UpdateConfigDto {
  empresa?: string;
  anioBase?: number;
  umbralCumplido?: number;
  umbralAlerta?: number;
  notificarCriticos?: boolean;
  requiereAprobacion?: boolean;
  requiereEvidencia?: boolean;
}

@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async obtener() {
    const existente = await this.prisma.config.findUnique({
      where: { id: 'global' },
    });
    if (existente) return existente;
    return this.prisma.config.create({ data: { id: 'global' } });
  }

  async actualizar(dto: UpdateConfigDto, usuarioId?: string) {
    const config = await this.prisma.config.upsert({
      where: { id: 'global' },
      update: dto,
      create: { id: 'global', ...dto },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Config',
      entidadId: 'global',
      detalle: dto as Record<string, unknown>,
    });
    return config;
  }

  async actualizarPonderacionPerspectiva(id: string, ponderacion: number) {
    return this.prisma.perspectiva.update({
      where: { id },
      data: { ponderacion },
    });
  }
}

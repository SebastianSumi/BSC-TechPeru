import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { UpdateConfigDto } from './config.dto.js';
import { validarUmbrales } from '../cumplimiento/cumplimiento.logic.js';

@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async obtener(empresaId?: string) {
    if (empresaId) {
      const propia = await this.prisma.config.findUnique({
        where: { empresaId },
      });
      if (propia) return propia;
    }
    const existente = await this.prisma.config.findUnique({
      where: { id: 'global' },
    });
    if (existente) return existente;
    return this.prisma.config.create({ data: { id: 'global' } });
  }

  async actualizar(
    dto: UpdateConfigDto,
    usuarioId?: string,
    empresaId?: string,
  ) {
    const actual = await this.obtener(empresaId);
    const umbralCumplido = dto.umbralCumplido ?? actual.umbralCumplido;
    const umbralAlerta = dto.umbralAlerta ?? actual.umbralAlerta;
    if (!validarUmbrales(umbralAlerta, umbralCumplido)) {
      throw new BadRequestException(
        'Los umbrales deben cumplir 0 <= alerta <= cumplido <= 100',
      );
    }
    const decimalesReporte = dto.decimalesReporte ?? actual.decimalesReporte;
    if (decimalesReporte < 0 || decimalesReporte > 6) {
      throw new BadRequestException('Los decimales deben estar entre 0 y 6');
    }

    if (empresaId) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
      });
      if (!empresa) throw new NotFoundException('Empresa no encontrada');
    }

    const id = empresaId ? `config-${empresaId}` : 'global';
    const data = {
      ...dto,
      ...(empresaId
        ? {
            empresaId,
            empresa: (
              await this.prisma.empresa.findUnique({ where: { id: empresaId } })
            )?.nombre,
          }
        : {}),
    };
    const config = await this.prisma.config.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Config',
      entidadId: id,
      detalle: { ...dto, empresaId: empresaId ?? null },
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

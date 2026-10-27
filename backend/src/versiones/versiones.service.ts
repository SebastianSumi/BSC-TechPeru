import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CreateVersionDto } from './versiones.dto.js';

@Injectable()
export class VersionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(empresaId?: string) {
    return this.prisma.planVersion.findMany({
      where: empresaId ? { empresaId } : undefined,
      include: { periodo: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtener(id: string) {
    const version = await this.prisma.planVersion.findUnique({
      where: { id },
      include: { periodo: true },
    });
    if (!version) throw new NotFoundException('Versión no encontrada');
    return version;
  }

  async crear(
    dto: CreateVersionDto,
    usuarioId?: string,
    empresaId = 'techperu',
  ) {
    const existe = await this.prisma.planVersion.findUnique({
      where: { version: dto.version },
    });
    if (existe) throw new BadRequestException('La versión ya existe');

    // Snapshot del estado actual del plan estratégico
    const [perspectivas, objetivos, kpis] = await Promise.all([
      this.prisma.perspectiva.findMany({ orderBy: { orden: 'asc' } }),
      this.prisma.objetivo.findMany({
        where: { empresaId },
        orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
      }),
      this.prisma.kpi.findMany({
        where: { empresaId },
        orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
      }),
    ]);

    const snapshot = {
      generadoEn: new Date().toISOString(),
      perspectivas,
      objetivos,
      kpis,
    };

    const version = await this.prisma.planVersion.create({
      data: {
        empresaId,
        version: dto.version,
        descripcion: dto.descripcion ?? '',
        periodoId: dto.periodoId,
        estado: 'BORRADOR',
        publicadoPor: dto.publicadoPor ?? '',
        snapshot,
      },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'PlanVersion',
      entidadId: version.id,
      detalle: { version: dto.version },
    });
    return version;
  }

  /**
   * Publica una versión: la marca VIGENTE y archiva las anteriores (RF-13 / RN-13).
   */
  async publicar(id: string, usuarioId?: string) {
    const actual = await this.obtener(id);
    await this.prisma.planVersion.updateMany({
      where: { estado: 'VIGENTE', empresaId: actual.empresaId },
      data: { estado: 'ARCHIVADA' },
    });
    const version = await this.prisma.planVersion.update({
      where: { id },
      data: { estado: 'VIGENTE', vigenteDesde: new Date() },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'PUBLICAR',
      entidad: 'PlanVersion',
      entidadId: id,
    });
    return version;
  }

  async archivar(id: string, usuarioId?: string) {
    await this.obtener(id);
    const version = await this.prisma.planVersion.update({
      where: { id },
      data: { estado: 'ARCHIVADA' },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ARCHIVAR',
      entidad: 'PlanVersion',
      entidadId: id,
    });
    return version;
  }
}

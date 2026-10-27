import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CumplimientoService } from '../cumplimiento/cumplimiento.service.js';
import { CreateRelacionDto } from './mapa.dto.js';

@Injectable()
export class MapaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly cumplimiento: CumplimientoService,
  ) {}

  /** Devuelve perspectivas, objetivos (con índice de cumplimiento) y relaciones causales. */
  async obtener(periodoId?: string, empresaId?: string) {
    const [perspectivas, objetivos, relaciones, kpis] = await Promise.all([
      this.prisma.perspectiva.findMany({ orderBy: { orden: 'asc' } }),
      this.prisma.objetivo.findMany({
        where: { activo: true, ...(empresaId ? { empresaId } : {}) },
        orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
      }),
      this.prisma.relacionCausal.findMany({
        where: empresaId ? { causa: { empresaId } } : undefined,
      }),
      this.prisma.kpi.findMany({
        where: { activo: true, ...(empresaId ? { empresaId } : {}) },
        include: periodoId
          ? { mediciones: { where: { periodoId } } }
          : undefined,
      }),
    ]);

    const reglas = await this.cumplimiento.reglas(empresaId);
    const objetivoIndice: Record<string, number> = {};
    for (const obj of objetivos) {
      const delObj = kpis.filter((k) => k.objetivoId === obj.id);
      objetivoIndice[obj.id] = this.cumplimiento.agregarObjetivo(
        delObj.map((k) => {
          const med = (k as { mediciones?: { meta: unknown; real: unknown }[] })
            .mediciones?.[0];
          return {
            cumplimiento: this.cumplimiento.evaluar(k, reglas, med ?? null)
              .mostrado,
            ponderacion: k.ponderacion,
          };
        }),
        reglas.agregacionObjetivo,
      );
    }

    return {
      perspectivaOrden: perspectivas.map((p) => p.id),
      perspectivas,
      objetivos: objetivos.map((o) => ({
        ...o,
        indice: objetivoIndice[o.id] ?? 0,
      })),
      relaciones,
    };
  }

  async crearRelacion(dto: CreateRelacionDto, usuarioId?: string) {
    if (dto.causaId === dto.efectoId) {
      throw new BadRequestException('Un objetivo no puede causarse a sí mismo');
    }
    const [causa, efecto] = await Promise.all([
      this.prisma.objetivo.findUnique({ where: { id: dto.causaId } }),
      this.prisma.objetivo.findUnique({ where: { id: dto.efectoId } }),
    ]);
    if (!causa || !efecto) {
      throw new BadRequestException('Objetivo de causa o efecto inexistente');
    }
    const existe = await this.prisma.relacionCausal.findUnique({
      where: {
        causaId_efectoId: { causaId: dto.causaId, efectoId: dto.efectoId },
      },
    });
    if (existe) throw new BadRequestException('La relación ya existe');

    const relacion = await this.prisma.relacionCausal.create({ data: dto });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'RelacionCausal',
      entidadId: relacion.id,
      detalle: dto as unknown as Record<string, unknown>,
    });
    return relacion;
  }

  async eliminarRelacion(id: string, usuarioId?: string) {
    const relacion = await this.prisma.relacionCausal.findUnique({
      where: { id },
    });
    if (!relacion) throw new NotFoundException('Relación no encontrada');
    const del = await this.prisma.relacionCausal.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ELIMINAR',
      entidad: 'RelacionCausal',
      entidadId: id,
    });
    return del;
  }
}

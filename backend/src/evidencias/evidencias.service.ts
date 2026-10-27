import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { AccesoService, type UsuarioSesion } from '../comun/acceso.service.js';
import { AlmacenamientoService } from './almacenamiento.service.js';
import { CreateEvidenciaDto, TIPOS_EVIDENCIA } from './evidencias.dto.js';

const MAX_TAMANO = 10 * 1024 * 1024;

const MIME_PERMITIDOS = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

@Injectable()
export class EvidenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly almacenamiento: AlmacenamientoService,
    private readonly acceso: AccesoService,
  ) {}

  listar(filtros: {
    kpiId?: string;
    medicionId?: string;
    desviacionId?: string;
    tareaId?: string;
    resultadoTareaId?: string;
    empresaId?: string;
  } = {}) {
    return this.prisma.evidencia.findMany({
      where: {
        ...(filtros.kpiId ? { kpiId: filtros.kpiId } : {}),
        ...(filtros.medicionId ? { medicionId: filtros.medicionId } : {}),
        ...(filtros.desviacionId ? { desviacionId: filtros.desviacionId } : {}),
        ...(filtros.tareaId ? { tareaId: filtros.tareaId } : {}),
        ...(filtros.resultadoTareaId
          ? { resultadoTareaId: filtros.resultadoTareaId }
          : {}),
        ...(filtros.empresaId ? { empresaId: filtros.empresaId } : {}),
      },
      include: {
        subidoPor: { select: { id: true, nombre: true } },
        kpi: { select: { id: true, nombre: true } },
        tarea: { select: { id: true, titulo: true } },
        resultadoTarea: { select: { id: true, descripcion: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtener(id: string) {
    const evidencia = await this.prisma.evidencia.findUnique({
      where: { id },
      include: {
        subidoPor: { select: { id: true, nombre: true } },
        kpi: { select: { id: true, nombre: true } },
        tarea: { select: { id: true, titulo: true } },
        resultadoTarea: { select: { id: true, descripcion: true } },
      },
    });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    return evidencia;
  }

  private async validarDestinos(dto: CreateEvidenciaDto) {
    if (dto.medicionId) {
      const medicion = await this.prisma.medicion.findUnique({
        where: { id: dto.medicionId },
      });
      if (!medicion) throw new BadRequestException('Medición inexistente');
    }
    if (dto.kpiId) {
      const kpi = await this.prisma.kpi.findUnique({ where: { id: dto.kpiId } });
      if (!kpi) throw new BadRequestException('KPI inexistente');
    }
    if (dto.desviacionId) {
      const desviacion = await this.prisma.desviacion.findUnique({
        where: { id: dto.desviacionId },
      });
      if (!desviacion) throw new BadRequestException('Desviación inexistente');
    }
    if (dto.tareaId) {
      const tarea = await this.prisma.tarea.findUnique({
        where: { id: dto.tareaId },
      });
      if (!tarea) throw new BadRequestException('Tarea inexistente');
    }
    if (dto.resultadoTareaId) {
      const resultado = await this.prisma.resultadoTarea.findUnique({
        where: { id: dto.resultadoTareaId },
      });
      if (!resultado) throw new BadRequestException('Resultado inexistente');
    }
  }

  private async puedeSubirEnTarea(
    usuario: UsuarioSesion | undefined,
    tareaId?: string,
    resultadoTareaId?: string,
  ) {
    if (!usuario) return true;
    if (!tareaId && !resultadoTareaId) return true;
    if (this.acceso.esGestorGlobal(usuario)) return true;
    const tarea = resultadoTareaId
      ? (
          await this.prisma.resultadoTarea.findUnique({
            where: { id: resultadoTareaId },
            include: { tarea: true },
          })
        )?.tarea
      : await this.prisma.tarea.findUnique({ where: { id: tareaId } });
    if (!tarea) return false;
    if (
      tarea.creadorId === usuario.id ||
      tarea.responsableId === usuario.id
    ) {
      return true;
    }
    return this.acceso.puedeEditarObjetivoPorId(usuario, tarea.objetivoId);
  }

  async crear(
    dto: CreateEvidenciaDto,
    usuario?: UsuarioSesion,
    empresaId = 'techperu',
  ) {
    await this.validarDestinos(dto);
    if (
      !(await this.puedeSubirEnTarea(
        usuario,
        dto.tareaId,
        dto.resultadoTareaId,
      ))
    ) {
      throw new ForbiddenException('No tiene permisos para adjuntar la evidencia');
    }
    const tipo = dto.tipo ?? 'ENLACE';
    if (!TIPOS_EVIDENCIA.includes(tipo as (typeof TIPOS_EVIDENCIA)[number])) {
      throw new BadRequestException('Tipo de evidencia inválido');
    }
    if (tipo === 'TEXTO' && !dto.contenido?.trim()) {
      throw new BadRequestException('La evidencia de texto requiere contenido');
    }
    if (tipo === 'ENLACE' && !dto.url?.trim()) {
      throw new BadRequestException('La evidencia de enlace requiere una URL');
    }

    let storageKey: string | null = null;
    let nombreArchivo = dto.nombreArchivo ?? null;
    let mimeType = dto.mimeType ?? null;
    let tamano = dto.tamano ?? null;

    if (tipo === 'ARCHIVO') {
      if (!dto.contenidoBase64) {
        throw new BadRequestException('La evidencia de archivo requiere contenido');
      }
      if (!mimeType || !MIME_PERMITIDOS.has(mimeType)) {
        throw new BadRequestException('Tipo MIME de archivo no permitido');
      }
      const base64 = dto.contenidoBase64.includes(',')
        ? dto.contenidoBase64.slice(dto.contenidoBase64.indexOf(',') + 1)
        : dto.contenidoBase64;
      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length === 0) {
        throw new BadRequestException('El archivo está vacío');
      }
      if (buffer.length > MAX_TAMANO) {
        throw new BadRequestException('El archivo supera el tamaño máximo de 10 MB');
      }
      tamano = buffer.length;
      nombreArchivo = (nombreArchivo || 'evidencia').replace(/[\\/]/g, '_');
      storageKey = await this.almacenamiento.guardar(
        buffer,
        nombreArchivo,
        mimeType,
      );
    }

    const evidencia = await this.prisma.evidencia.create({
      data: {
        empresaId,
        medicionId: dto.medicionId,
        kpiId: dto.kpiId,
        desviacionId: dto.desviacionId,
        tareaId: dto.tareaId,
        resultadoTareaId: dto.resultadoTareaId,
        tipo,
        titulo: dto.titulo,
        url: dto.url ?? '',
        contenido: tipo === 'TEXTO' ? dto.contenido : null,
        nombreArchivo,
        mimeType,
        tamano,
        storageKey,
        descripcion: dto.descripcion ?? '',
        subidoPorId: usuario?.id,
      },
    });
    await this.auditoria.registrar({
      usuarioId: usuario?.id,
      accion: 'CREAR',
      entidad: 'Evidencia',
      entidadId: evidencia.id,
      detalle: { titulo: dto.titulo, tipo },
    });
    return evidencia;
  }

  async archivo(id: string) {
    const evidencia = await this.obtener(id);
    if (evidencia.tipo !== 'ARCHIVO' || !evidencia.storageKey) {
      throw new BadRequestException('La evidencia no es un archivo descargable');
    }
    const contenido = await this.almacenamiento.leer(evidencia.storageKey);
    return {
      contenido,
      nombreArchivo: evidencia.nombreArchivo ?? 'evidencia',
      mimeType: evidencia.mimeType ?? 'application/octet-stream',
      evidencia,
    };
  }

  async eliminar(id: string, usuario?: UsuarioSesion) {
    const evidencia = await this.obtener(id);
    if (usuario && !this.acceso.esGestorGlobal(usuario)) {
      if (evidencia.subidoPorId !== usuario.id) {
        throw new ForbiddenException('No puede eliminar esta evidencia');
      }
    }
    if (evidencia.storageKey) {
      await this.almacenamiento.eliminar(evidencia.storageKey);
    }
    const del = await this.prisma.evidencia.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId: usuario?.id,
      accion: 'ELIMINAR',
      entidad: 'Evidencia',
      entidadId: id,
    });
    return del;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface UsuarioSesion {
  id: string;
  rol: string;
}

@Injectable()
export class AccesoService {
  constructor(private readonly prisma: PrismaService) {}

  esGestorGlobal(usuario?: UsuarioSesion | null): boolean {
    return usuario?.rol === 'ADMIN' || usuario?.rol === 'GERENTE';
  }

  puedeEditarObjetivo(
    usuario: UsuarioSesion | null | undefined,
    objetivo: { responsableId?: string | null } | null | undefined,
  ): boolean {
    if (!usuario) return false;
    if (this.esGestorGlobal(usuario)) return true;
    return Boolean(objetivo?.responsableId && objetivo.responsableId === usuario.id);
  }

  async puedeEditarObjetivoPorId(
    usuario: UsuarioSesion | null | undefined,
    objetivoId: string,
  ): Promise<boolean> {
    if (!usuario) return false;
    if (this.esGestorGlobal(usuario)) return true;
    const objetivo = await this.prisma.objetivo.findUnique({
      where: { id: objetivoId },
      select: { responsableId: true },
    });
    return Boolean(objetivo?.responsableId === usuario.id);
  }

  async puedeEditarKpi(
    usuario: UsuarioSesion | null | undefined,
    kpiId: string,
  ): Promise<boolean> {
    if (!usuario) return false;
    if (this.esGestorGlobal(usuario)) return true;
    const kpi = await this.prisma.kpi.findUnique({
      where: { id: kpiId },
      select: {
        responsableId: true,
        objetivoRef: { select: { responsableId: true } },
      },
    });
    if (!kpi) return false;
    return Boolean(
      kpi.responsableId === usuario.id ||
        kpi.objetivoRef.responsableId === usuario.id,
    );
  }
}

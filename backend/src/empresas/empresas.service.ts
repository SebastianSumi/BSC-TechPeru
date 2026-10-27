import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.empresa.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { objetivos: true, kpis: true, periodos: true } },
      },
    });
  }

  async obtener(id: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }
}

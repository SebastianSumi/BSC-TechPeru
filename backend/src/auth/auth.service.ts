import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUsuarioDto, LoginDto, UpdateUsuarioDto } from './auth.dto.js';
import { RolNombre } from './roles.constants.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private async firmar(usuario: {
    id: string;
    email: string;
    nombre: string;
    rol: { nombre: string };
  }) {
    const payload = { sub: usuario.id, rol: usuario.rol.nombre };
    return {
      accessToken: await this.jwt.signAsync(payload),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol.nombre,
      },
    };
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { rol: true },
    });
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return this.firmar(usuario);
  }

  async me(userId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true },
    });
    if (!usuario) throw new UnauthorizedException();
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol.nombre,
    };
  }

  async listarUsuarios() {
    return this.prisma.usuario.findMany({
      include: { rol: true, asignaciones: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async crearUsuario(dto: CreateUsuarioDto) {
    const existe = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existe) throw new ConflictException('El email ya está registrado');

    const rol = await this.prisma.rol.findUnique({
      where: { nombre: dto.rol },
    });
    if (!rol) throw new ConflictException('Rol inexistente');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        nombre: dto.nombre,
        passwordHash,
        rolId: rol.id,
      },
      include: { rol: true },
    });
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol.nombre,
      activo: usuario.activo,
    };
  }

  async actualizarUsuario(id: string, dto: UpdateUsuarioDto) {
    const data: Record<string, unknown> = {};
    if (dto.nombre) data.nombre = dto.nombre;
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.rol) {
      const rol = await this.prisma.rol.findUnique({
        where: { nombre: dto.rol },
      });
      if (!rol) throw new ConflictException('Rol inexistente');
      data.rolId = rol.id;
    }
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data,
      include: { rol: true },
    });
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol.nombre,
      activo: usuario.activo,
    };
  }

  async listarRoles() {
    return this.prisma.rol.findMany({ orderBy: { nombre: 'asc' } });
  }
}

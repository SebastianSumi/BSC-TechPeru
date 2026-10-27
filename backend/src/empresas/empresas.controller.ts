import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { EmpresasService } from './empresas.service.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';

@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresasController {
  constructor(private readonly empresas: EmpresasService) {}

  @Get()
  listar() {
    return this.empresas.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.empresas.obtener(id);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ImportacionService } from './importacion.service.js';
import { ImportarMedicionesDto } from './importacion.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('importacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportacionController {
  constructor(private readonly importacion: ImportacionService) {}

  @Post('mediciones')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE, RolNombre.ANALISTA)
  importar(
    @Body() dto: ImportarMedicionesDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.importacion.importarMediciones(dto, user.id);
  }
}

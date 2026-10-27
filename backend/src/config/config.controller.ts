import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from './config.service.js';
import { UpdateConfigDto } from './config.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { Roles } from '../auth/decorators.js';
import { RolNombre } from '../auth/roles.constants.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfigController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  obtener(@Query('empresa') empresaId?: string) {
    return this.config.obtener(empresaId);
  }

  @Patch()
  @Roles(RolNombre.ADMIN)
  actualizar(
    @Body() dto: UpdateConfigDto,
    @CurrentUser() user: { id: string },
    @Query('empresa') empresaId?: string,
  ) {
    return this.config.actualizar(dto, user.id, empresaId);
  }

  @Patch('perspectivas/:id/ponderacion')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  ponderacion(
    @Param('id') id: string,
    @Body('ponderacion') ponderacion: number,
  ) {
    return this.config.actualizarPonderacionPerspectiva(id, Number(ponderacion));
  }
}

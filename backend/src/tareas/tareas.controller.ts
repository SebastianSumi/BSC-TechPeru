import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TareasService } from './tareas.service.js';
import {
  CreateResultadoTareaDto,
  CreateTareaDto,
  UpdateTareaDto,
  ValidarResultadoTareaDto,
} from './tareas.dto.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('tareas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TareasController {
  constructor(private readonly tareas: TareasService) {}

  @Get()
  listar(
    @Query('objetivo') objetivoId?: string,
    @Query('kpi') kpiId?: string,
    @Query('responsable') responsableId?: string,
    @Query('estado') estado?: string,
    @Query('empresa') empresaId?: string,
  ) {
    return this.tareas.listar({
      objetivoId,
      kpiId,
      responsableId,
      estado,
      empresaId,
    });
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.tareas.obtener(id);
  }

  @Post()
  crear(
    @Body() dto: CreateTareaDto,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.tareas.crear(dto, user);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateTareaDto,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.tareas.actualizar(id, dto, user);
  }

  @Delete(':id')
  eliminar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.tareas.eliminar(id, user);
  }

  @Get(':id/resultados')
  listarResultados(@Param('id') id: string) {
    return this.tareas.listarResultados(id);
  }

  @Post(':id/resultados')
  crearResultado(
    @Param('id') id: string,
    @Body() dto: CreateResultadoTareaDto,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.tareas.crearResultado(id, dto, user);
  }

  @Patch('resultados/:id/validar')
  validarResultado(
    @Param('id') id: string,
    @Body() dto: ValidarResultadoTareaDto,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.tareas.validarResultado(id, dto, user);
  }
}

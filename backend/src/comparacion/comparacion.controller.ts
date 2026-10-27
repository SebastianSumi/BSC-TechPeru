import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ComparacionService } from './comparacion.service.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards.js';

@Controller('comparacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComparacionController {
  constructor(private readonly comparacion: ComparacionService) {}

  @Get()
  comparar(
    @Query('a') periodoA?: string,
    @Query('b') periodoB?: string,
    @Query('empresa') empresaId?: string,
  ) {
    if (!periodoA || !periodoB) {
      throw new BadRequestException('Se requieren los parámetros a y b');
    }
    return this.comparacion.comparar(periodoA, periodoB, empresaId);
  }
}

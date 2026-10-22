import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

const ESTADOS = [
  'PLANIFICADA',
  'EN_CURSO',
  'EN_RIESGO',
  'COMPLETADA',
  'CANCELADA',
] as const;

export class CreateIniciativaDto {
  @IsString()
  codigo!: string;

  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  objetivoId!: string;

  @IsOptional()
  @IsString()
  kpiId?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsNumber()
  presupuesto?: number;
}

export class UpdateIniciativaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  objetivoId?: string;

  @IsOptional()
  @IsString()
  kpiId?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsNumber()
  presupuesto?: number;

  @IsOptional()
  @IsNumber()
  avance?: number;

  @IsOptional()
  @IsIn(ESTADOS)
  estado?: string;
}

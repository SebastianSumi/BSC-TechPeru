import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const TIPOS = ['MAYOR_MEJOR', 'MENOR_MEJOR', 'RANGO'] as const;
const FRECUENCIAS = ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'] as const;
export const UNIDADES_MEDIDA = [
  'PORCENTAJE',
  'SOLES',
  'PUNTOS',
  'DIAS',
  'SEMANAS',
  'HORAS',
  'NUMERO_ORDEN',
] as const;
export const AGREGACIONES_PERIODO_KPI = [
  'ULTIMO',
  'SUMA',
  'PROMEDIO',
  'ACUMULADO',
] as const;

export class CreateIndicadorDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsString()
  perspectivaId!: string;

  @IsString()
  objetivoId!: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  unidad?: string;

  @IsOptional()
  @IsIn(UNIDADES_MEDIDA)
  unidadMedida?: string;

  @IsNumber()
  meta!: number;

  @IsNumber()
  real!: number;

  @IsOptional()
  @IsBoolean()
  inverso?: boolean;

  @IsOptional()
  @IsIn(TIPOS)
  tipo?: string;

  @IsOptional()
  @IsIn(FRECUENCIAS)
  frecuencia?: string;

  @IsOptional()
  @IsString()
  formula?: string;

  @IsOptional()
  @IsString()
  fuenteDatos?: string;

  @IsOptional()
  @IsString()
  responsableValidacion?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsNumber()
  umbralCumplido?: number;

  @IsOptional()
  @IsNumber()
  umbralAlerta?: number;

  @IsOptional()
  @IsNumber()
  rangoMin?: number;

  @IsOptional()
  @IsNumber()
  rangoMax?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  decimales?: number;

  @IsOptional()
  @IsIn(AGREGACIONES_PERIODO_KPI)
  agregacionPeriodos?: string;

  @IsOptional()
  @IsString()
  accion?: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsOptional()
  @IsNumber()
  ponderacion?: number;
}

export class UpdateIndicadorDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  perspectivaId?: string;

  @IsOptional()
  @IsString()
  objetivoId?: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  unidad?: string;

  @IsOptional()
  @IsIn(UNIDADES_MEDIDA)
  unidadMedida?: string;

  @IsOptional()
  @IsNumber()
  meta?: number;

  @IsOptional()
  @IsNumber()
  real?: number;

  @IsOptional()
  @IsBoolean()
  inverso?: boolean;

  @IsOptional()
  @IsIn(TIPOS)
  tipo?: string;

  @IsOptional()
  @IsIn(FRECUENCIAS)
  frecuencia?: string;

  @IsOptional()
  @IsString()
  formula?: string;

  @IsOptional()
  @IsString()
  fuenteDatos?: string;

  @IsOptional()
  @IsString()
  responsableValidacion?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsNumber()
  umbralCumplido?: number;

  @IsOptional()
  @IsNumber()
  umbralAlerta?: number;

  @IsOptional()
  @IsNumber()
  rangoMin?: number;

  @IsOptional()
  @IsNumber()
  rangoMax?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  decimales?: number;

  @IsOptional()
  @IsIn(AGREGACIONES_PERIODO_KPI)
  agregacionPeriodos?: string;

  @IsOptional()
  @IsString()
  accion?: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsOptional()
  @IsNumber()
  ponderacion?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

const TIPOS = ['MAYOR_MEJOR', 'MENOR_MEJOR', 'RANGO'] as const;
const FRECUENCIAS = ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'] as const;

export class CreateIndicadorDto {
  @IsString()
  id!: string;

  @IsString()
  perspectivaId!: string;

  @IsOptional()
  @IsString()
  objetivoId?: string;

  @IsString()
  objetivo!: string;

  @IsString()
  nombre!: string;

  @IsString()
  unidad!: string;

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

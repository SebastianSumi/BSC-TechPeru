import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const ESTADOS_TAREA = [
  'PENDIENTE',
  'EN_PROCESO',
  'COMPLETADA',
  'CANCELADA',
] as const;
const ESTADOS_VALIDACION = ['VALIDADO', 'RECHAZADO'] as const;

export class CreateTareaDto {
  @IsString()
  titulo!: string;

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
  @IsIn(ESTADOS_TAREA)
  estado?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  avance?: number;
}

export class UpdateTareaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

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
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsIn(ESTADOS_TAREA)
  estado?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  avance?: number;
}

export class CreateResultadoTareaDto {
  @IsString()
  descripcion!: string;

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenciaIds?: string[];
}

export class ValidarResultadoTareaDto {
  @IsIn(ESTADOS_VALIDACION)
  estadoValidacion!: 'VALIDADO' | 'RECHAZADO';

  @IsOptional()
  @IsString()
  periodoId?: string;

  @IsOptional()
  @IsNumber()
  valorAplicado?: number;
}

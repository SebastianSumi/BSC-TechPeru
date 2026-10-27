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

export const FORMATOS_PORCENTAJE = ['DECIMAL', 'ENTERO', 'AUTO'] as const;
export const AGREGACIONES_OBJETIVO = ['PROMEDIO', 'PONDERADO', 'MINIMO'] as const;
export const AGREGACIONES_PERIODOS = ['ULTIMO', 'SUMA', 'PROMEDIO', 'ACUMULADO'] as const;
export const AGREGACIONES_RESULTADOS = ['NINGUNA', 'SUMA', 'ULTIMO', 'PROMEDIO'] as const;

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  empresa?: string;

  @IsOptional()
  @IsInt()
  anioBase?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  umbralCumplido?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  umbralAlerta?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  decimalesReporte?: number;

  @IsOptional()
  @IsIn(FORMATOS_PORCENTAJE)
  formatoPorcentaje?: string;

  @IsOptional()
  @IsBoolean()
  limitarPorcentaje?: boolean;

  @IsOptional()
  @IsIn(AGREGACIONES_OBJETIVO)
  agregacionObjetivo?: string;

  @IsOptional()
  @IsIn(AGREGACIONES_PERIODOS)
  agregacionPeriodos?: string;

  @IsOptional()
  @IsIn(AGREGACIONES_RESULTADOS)
  agregacionResultados?: string;

  @IsOptional()
  @IsBoolean()
  notificarCriticos?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereEvidencia?: boolean;
}

import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export const TIPOS_EVIDENCIA = ['TEXTO', 'ARCHIVO', 'ENLACE'] as const;

export class CreateEvidenciaDto {
  @IsOptional()
  @IsString()
  medicionId?: string;

  @IsOptional()
  @IsString()
  kpiId?: string;

  @IsOptional()
  @IsString()
  desviacionId?: string;

  @IsOptional()
  @IsString()
  tareaId?: string;

  @IsOptional()
  @IsString()
  resultadoTareaId?: string;

  @IsOptional()
  @IsIn(TIPOS_EVIDENCIA)
  tipo?: string;

  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @IsString()
  nombreArchivo?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tamano?: number;

  @IsOptional()
  @IsString()
  contenidoBase64?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

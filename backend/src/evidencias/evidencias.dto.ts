import { IsOptional, IsString } from 'class-validator';

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
  tipo?: string;

  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

const ESTADOS = [
  'PENDIENTE',
  'EN_PROCESO',
  'CUMPLIDO',
  'VENCIDO',
  'CANCELADO',
] as const;

export class CreateCompromisoDto {
  @IsString()
  reunion!: string;

  @IsString()
  descripcion!: string;

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
  fechaLimite?: string;
}

export class UpdateCompromisoDto {
  @IsOptional()
  @IsString()
  reunion?: string;

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
  fechaLimite?: string;

  @IsOptional()
  @IsIn(ESTADOS)
  estado?: string;
}

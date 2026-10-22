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

export class CreateDesviacionDto {
  @IsString()
  kpiId!: string;

  @IsOptional()
  @IsString()
  periodoId?: string;

  @IsString()
  causa!: string;

  @IsOptional()
  @IsString()
  impacto?: string;

  @IsOptional()
  @IsString()
  medidaCorrectiva?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsDateString()
  fechaLimite?: string;
}

export class UpdateDesviacionDto {
  @IsOptional()
  @IsString()
  causa?: string;

  @IsOptional()
  @IsString()
  impacto?: string;

  @IsOptional()
  @IsString()
  medidaCorrectiva?: string;

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

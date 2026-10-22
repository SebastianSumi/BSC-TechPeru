import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateObjetivoDto {
  @IsString()
  codigo!: string;

  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  perspectivaId!: string;

  @IsOptional()
  @IsNumber()
  ponderacion?: number;

  @IsOptional()
  @IsNumber()
  orden?: number;
}

export class UpdateObjetivoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  perspectivaId?: string;

  @IsOptional()
  @IsNumber()
  ponderacion?: number;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

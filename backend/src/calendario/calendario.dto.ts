import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventoDto {
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  periodoId?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateEventoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  periodoId?: string;

  @IsOptional()
  @IsString()
  responsableId?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  completado?: boolean;
}

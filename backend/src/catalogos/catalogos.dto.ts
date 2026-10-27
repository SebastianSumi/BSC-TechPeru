import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCatalogoDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,20}$/, {
    message: 'El código abreviado solo admite letras, números, guion y guion bajo',
  })
  codigo!: string;

  @IsString()
  @MaxLength(160)
  titulo!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  icono?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateCatalogoDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,20}$/, {
    message: 'El código abreviado solo admite letras, números, guion y guion bajo',
  })
  codigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  icono?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

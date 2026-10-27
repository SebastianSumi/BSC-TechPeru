import { IsHexColor, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  sigla?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sector?: string;

  @IsOptional()
  @IsString()
  @IsHexColor({ message: 'El color debe ser un hexagonal #RRGGBB' })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  vision?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mision?: string;
}

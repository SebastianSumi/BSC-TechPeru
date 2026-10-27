import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateRecomendacionDto {
  @IsString()
  contenido!: string;

  @IsOptional()
  @IsString()
  objetivoId?: string;

  @IsOptional()
  @IsString()
  kpiId?: string;

  @IsOptional()
  @IsBoolean()
  fijada?: boolean;
}

export class UpdateRecomendacionDto {
  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @IsBoolean()
  fijada?: boolean;
}

import { IsArray, IsOptional, IsString } from 'class-validator';

export class ImportarMedicionesDto {
  @IsString()
  periodoId!: string;

  @IsOptional()
  @IsString()
  csv?: string;

  @IsOptional()
  @IsArray()
  filas?: { kpiId: string; meta: number; real: number; nota?: string }[];
}

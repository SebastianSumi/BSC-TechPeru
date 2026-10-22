import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertMedicionDto {
  @IsString()
  periodoId!: string;

  @IsNumber()
  meta!: number;

  @IsNumber()
  real!: number;

  @IsOptional()
  @IsString()
  nota?: string;
}

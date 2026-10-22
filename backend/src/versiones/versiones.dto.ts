import { IsOptional, IsString } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  version!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  periodoId?: string;

  @IsOptional()
  @IsString()
  publicadoPor?: string;
}

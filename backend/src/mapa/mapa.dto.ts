import { IsOptional, IsString } from 'class-validator';

export class CreateRelacionDto {
  @IsString()
  causaId!: string;

  @IsString()
  efectoId!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

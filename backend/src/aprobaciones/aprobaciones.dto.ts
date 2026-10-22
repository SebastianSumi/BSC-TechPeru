import { IsOptional, IsString } from 'class-validator';

export class ResolverAprobacionDto {
  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsString()
  tipo?: string;
}

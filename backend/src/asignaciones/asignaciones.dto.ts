import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAsignacionDto {
  @IsString()
  @IsNotEmpty()
  usuarioId!: string;

  @IsString()
  @IsNotEmpty()
  kpiId!: string;
}

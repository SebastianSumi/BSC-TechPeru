import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

const ESTADOS = ['NUEVA', 'RECONOCIDA', 'RESUELTA', 'DESCARTADA'] as const;
const SEVERIDADES = ['INFO', 'ADVERTENCIA', 'CRITICA'] as const;

export class CreateAlertaDto {
  @IsOptional()
  @IsString()
  kpiId?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsIn(SEVERIDADES)
  severidad?: string;

  @IsString()
  mensaje!: string;

  @IsOptional()
  @IsString()
  destinatarioId?: string;
}

export class UpdateAlertaDto {
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: string;

  @IsOptional()
  leida?: boolean;
}

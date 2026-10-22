import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RolNombre } from '../auth/roles.constants.js';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class CreateUsuarioDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(RolNombre)
  rol!: RolNombre;
}

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(RolNombre)
  rol?: RolNombre;

  @IsOptional()
  activo?: boolean;
}

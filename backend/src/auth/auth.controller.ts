import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateUsuarioDto, LoginDto, UpdateUsuarioDto } from './auth.dto.js';
import { Public, Roles } from './decorators.js';
import { JwtAuthGuard, RolesGuard } from './guards.js';
import { RolNombre } from './roles.constants.js';
import { CurrentUser } from './current-user.decorator.js';

@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.auth.me(user.id);
  }

  @Get('roles')
  roles() {
    return this.auth.listarRoles();
  }

  @Get('usuarios')
  @Roles(RolNombre.ADMIN, RolNombre.GERENTE)
  usuarios() {
    return this.auth.listarUsuarios();
  }

  @Post('usuarios')
  @Roles(RolNombre.ADMIN)
  crear(@Body() dto: CreateUsuarioDto) {
    return this.auth.crearUsuario(dto);
  }

  @Patch('usuarios/:id')
  @Roles(RolNombre.ADMIN)
  actualizar(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.auth.actualizarUsuario(id, dto);
  }
}

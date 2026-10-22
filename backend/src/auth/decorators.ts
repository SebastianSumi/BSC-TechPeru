import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY, RolNombre, ROLES_KEY } from './roles.constants.js';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: RolNombre[]) => SetMetadata(ROLES_KEY, roles);

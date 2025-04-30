import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/classes/enum/role.enum';

/**
 * serve a definire il decoratore per la logica di accesso in base al ruolo
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

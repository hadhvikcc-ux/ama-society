import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.some((role) => {
      if (user.role === role) return true;
      if (role === 'RESIDENT' && (user.role === 'RESIDENT_OWNER' || user.role === 'RESIDENT_TENANT')) return true;
      if ((role === 'RESIDENT_OWNER' || role === 'RESIDENT_TENANT') && user.role === 'RESIDENT') return true;
      if (user.role === 'ADMIN') return true;
      return false;
    });
  }
}

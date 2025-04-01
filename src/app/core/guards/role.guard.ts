import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services';
import { UserRole } from '../../models'

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as UserRole[];
  const currentUser = authService.currentUser();

  if (currentUser && allowedRoles.includes(currentUser.role)) {
    return true;
  }

  // Redirect to dashboard if authenticated but wrong role
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  // Redirect to login if not authenticated
  return router.createUrlTree(['/login']);
};

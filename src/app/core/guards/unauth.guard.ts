import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services';

export const unauthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // User is already authenticated, redirect to dashboard
    return router.createUrlTree(['/dashboard/documents']);
  }

  // User is not authenticated, allow access to auth pages
  return true;
};

import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Auth guard: allows route activation only when a valid token is stored.
 * Redirects unauthenticated users to the login page.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  if (authService.isAuthenticated()) {
    return true;
  }
  authService.logout();
  return false;
};

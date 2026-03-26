import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';
import { AuthDataContextService } from './auth-data-context.service';

const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  _: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {

  // console.log('Dashboard route guard activated for:', route, route.params);

  const { authenticated } = authData;

  const contextService = inject(AuthDataContextService);
  contextService.setAuthData(authData);

  if (authenticated) {
    return true;
  }

  const router = inject(Router);

  return router.parseUrl('/forbidden');
};

export const canActivateAuthRole = createAuthGuard<CanActivateFn>(isAccessAllowed);
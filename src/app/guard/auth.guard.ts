import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, ActivatedRoute } from '@angular/router';

import { KeycloakAuthGuard } from 'keycloak-angular';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../guard/auth.guard.service';
// import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {

  constructor(
    protected readonly router: Router,
    protected readonly keycloak: KeycloakService,
    private _snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private authRightsServ: AuthService,

  ) {

    super(router, keycloak);

  }

  async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {

    if (!this.authenticated) {

      let redirect = window.location.origin + state.url;

      // if (environment.production) redirect = window.location.origin + '/fvt' + state.url;

      await this.keycloak.login({

        redirectUri: redirect,

      });


      if (route.params.id) {

        if (this.authenticated && this.authRightsServ.checkReadRights(route.params.id)) return true
        else {

          this.router.navigate(['cases-overview'], { relativeTo: this.route })
          this._snackBar.open('Access Denied. You are not allowed to access this case.', 'X', { duration: 5000, panelClass: 'errorClass', verticalPosition: 'top', horizontalPosition: 'center' })

          return false

        }


      } else return this.authenticated;



    }

    return this.authenticated;
  }
}

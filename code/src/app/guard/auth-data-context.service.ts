import { Injectable } from '@angular/core';
import { AuthGuardData } from 'keycloak-angular';

@Injectable({
    providedIn: 'root',
})
export class AuthDataContextService {
    private _authData: AuthGuardData;

    setAuthData(data: AuthGuardData) {
        this._authData = data;
    }

    logout() {
        this._authData?.keycloak?.logout()
    }

    get authData(): AuthGuardData {
        return this._authData;
    }

    get token(): string {
        return this._authData?.keycloak?.token || '';
    }

    get userId(): string {

        // *FIX
        // console.log(this._authData?.keycloak.loadUserInfo);
        // userProfile?.attributes?.elastic_id?.[0] || '';
        // console.log(this._authData);

        return 'true'

    }
}

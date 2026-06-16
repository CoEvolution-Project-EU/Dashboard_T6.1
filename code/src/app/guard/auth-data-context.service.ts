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
        this._authData?.keycloak?.logout();
    }

    get authData(): AuthGuardData {
        return this._authData;
    }

    get token(): string {
        return this._authData?.keycloak?.token || '';
    }

    async getFreshToken(): Promise<string> {
        const kc = this._authData?.keycloak;
        if (!kc) return '';
        try {
            await kc.updateToken(30);
        } catch {
        }
        return kc.token || '';
    }

    get userId(): string {
        const parsed = this._authData?.keycloak?.idTokenParsed;
        return (parsed?.['preferred_username'] as string) || (parsed?.['sub'] as string) || '';
    }

    get username(): string {
        const parsed = this._authData?.keycloak?.idTokenParsed;
        return (parsed?.['preferred_username'] as string) || (parsed?.['name'] as string) || '';
    }
}

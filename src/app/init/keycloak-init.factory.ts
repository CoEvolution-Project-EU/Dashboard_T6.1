import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment'


export function initializeKeycloak(keycloak: KeycloakService): () => Promise<boolean> {
    return () =>
        keycloak.init({
            config: {
                url: environment.keycloakURL,
                realm: 'coevolution',
                clientId: 'coevolution',
                // clientId: 'fvt',
            },
            initOptions: {
                checkLoginIframe: true,
                checkLoginIframeInterval: 25
            },
            loadUserProfileAtStartUp: true
        });
}

// url: 'https://dev.aegisresearch.eu:8443/auth',
// url: 'https://fvt-demo.aegisresearch.eu:8444/auth'
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideKeycloak } from 'keycloak-angular';

import { appRoutes } from './app.routes';
import { environment } from 'src/environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKeycloak({
      config: {
        url: environment.keycloakURL,
        realm: 'coevolution',
        clientId: 'coevolution',
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: true,
        checkLoginIframeInterval: 25,
      },
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideAnimations(),
    provideNativeDateAdapter()
  ],
};
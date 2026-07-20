import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

/** Rutele tab bar-ului — comutarea între ele trebuie să fie instant, ca în
 *  iOS, fără cross-fade de View Transition (acela rămâne pentru push-uri). */
const TAB_URLS = ['/home', '/random', '/profile'];
const isTabUrl = (url: string) => TAB_URLS.some((t) => url === t || url.startsWith(t + '?'));

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withViewTransitions({
        onViewTransitionCreated: (info) => {
          const from = info.from.toString();
          const to = info.to.toString();
          if (isTabUrl(from) && isTabUrl(to)) {
            info.transition.skipTransition();
          }
        },
      }),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

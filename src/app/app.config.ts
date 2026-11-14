import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideHotToastConfig } from '@ngxpert/hot-toast';
import { routes } from './app.routes';
import { authInterceptor } from '../interceptor/auth.interceptor';
import { provideCloudinaryLoader } from '../ui/image';
import { onRouteTransition } from '../ui/route-transition';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated: onRouteTransition })),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideCloudinaryLoader(),
    provideStore(),
    provideStoreDevtools({ maxAge: 25 }),
    provideToastr(),
    provideAnimations(),
    provideHotToastConfig(),
  ]
};

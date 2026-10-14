import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { AdminRootComponent } from './admin-root.component';
import { adminRoutes } from './admin.routes';
import { registerIcons } from './app/core/icons';

registerIcons();

bootstrapApplication(AdminRootComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({}),
    provideRouter(adminRoutes),
  ],
}).catch((error: unknown) => console.error(error));

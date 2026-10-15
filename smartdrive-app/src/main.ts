import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { registerIcons } from './app/core/icons';

const initialTheme = localStorage.getItem('smartdrive-theme') === 'dark' ? 'dark' : 'light';
document.documentElement.dataset['theme'] = initialTheme;
document.documentElement.style.colorScheme = initialTheme;

registerIcons();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({}),
    provideRouter(routes),
  ],
}).catch((err) => console.error(err));

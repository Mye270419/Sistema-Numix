import { ApplicationConfig } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(), // permite pasar params de ruta como @Input()
      withPreloading(PreloadAllModules) // precarga los módulos lazy en segundo plano
    )
  ]
};
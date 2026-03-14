import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./splash-screen/splash-screen').then(m => m.SplashScreenComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then(m => m.LoginComponent),
  },

  // ── Rutas protegidas (requieren auth) ───────────────────
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'libro-mayor',
    loadComponent: () =>
      import('./libro-mayor/libro-mayor').then(m => m.LibroMayorComponent),
  },
  {
    path: 'facturacion',
    loadComponent: () =>
      import('./facturacion/facturacion').then(m => m.FacturacionComponent),
  },
  {
    path: 'cuentas-cobrar',
    loadComponent: () =>
      import('./cuentas-cobrar/cuentas-cobrar').then(m => m.CuentasCobrarComponent),
  },
  {
    path: 'cuentas-pagar',
    loadComponent: () =>
      import('./cuentas-pagar/cuentas-pagar').then(m => m.CuentasPagarComponent),
  },
  {
    path: 'informes',
    loadComponent: () =>
      import('./informes-financieros/informes-financieros').then(m => m.InformesFinancierosComponent),
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./configuracion/configuracion').then(m => m.ConfiguracionComponent),
  },

  // ── Módulos nuevos ───────────────────────────────────────
  {
    path: 'nominas',
    loadComponent: () =>
      import('./nominas/nominas').then(m => m.NominasComponent),
  },
  {
    path: 'activos-fijos',
    loadComponent: () =>
      import('./activos-fijos/activos-fijos').then(m => m.ActivosFijosComponent),
  },
  {
    path: 'inventario',
    loadComponent: () =>
      import('./inventario/inventario').then(m => m.InventarioComponent),
  },
  {
    path: 'auditoria',
    loadComponent: () =>
      import('./auditoria/auditoria').then(m => m.AuditoriaComponent),
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: '**', redirectTo: '/login' },
];
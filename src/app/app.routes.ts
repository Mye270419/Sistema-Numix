
import { Routes } from '@angular/router';
import { SplashScreenComponent } from './splash-screen/splash-screen';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { LibroMayorComponent } from './libro-mayor/libro-mayor';
import { FacturacionComponent } from './facturacion/facturacion';
import { CuentasCobrarComponent } from './cuentas-cobrar/cuentas-cobrar';
import { CuentasPagarComponent } from './cuentas-pagar/cuentas-pagar';
import { ConfiguracionComponent } from './configuracion/configuracion';
import { InformesFinancierosComponent } from './informes-financieros/informes-financieros';


export const routes: Routes = [
  { path: '', component: SplashScreenComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'libro-mayor', component: LibroMayorComponent },
  { path: 'facturacion', component: FacturacionComponent },
  { path: 'cuentas-cobrar',component:CuentasCobrarComponent},
  { path: 'cuentas-pagar', component: CuentasPagarComponent },
  { path: 'informes', component: InformesFinancierosComponent},
  { path: 'configuracion', component: ConfiguracionComponent },
  { path: '**', redirectTo: '/login' }
];
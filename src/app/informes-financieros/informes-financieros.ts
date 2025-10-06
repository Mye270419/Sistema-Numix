import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';

// Declarar anime.js
declare var anime: any;

interface CuentaBalance {
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'EGRESO';
  nivel: number;
  saldoDeudor: number;
  saldoAcreedor: number;
  saldoFinal: number;
}

interface AsientoContable {
  id: number;
  fecha: string;
  referencia: string;
  descripcion: string;
  detalles: DetalleAsiento[];
  totalDebito: number;
  totalCredito: number;
}

interface DetalleAsiento {
  codigoCuenta: string;
  nombreCuenta: string;
  descripcion: string;
  debito: number;
  credito: number;
}

interface ParametrosReporte {
  fechaInicio: string;
  fechaFin: string;
  tipoReporte: 'balance' | 'resultados' | 'diario' | 'mayor';
  incluirCuentasCero: boolean;
  nivel: number;
}

@Component({
  selector: 'app-informes-financieros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes-financieros.html',
  styleUrls: ['./informes-financieros.css']
})
export class InformesFinancierosComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;

  // Estado de la vista
  vistaActual: 'dashboard' | 'balance' | 'resultados' | 'diario' | 'mayor' = 'dashboard';

  // Parámetros de reportes
  parametros: ParametrosReporte = {
    fechaInicio: '2024-01-01',
    fechaFin: new Date().toISOString().split('T')[0],
    tipoReporte: 'balance',
    incluirCuentasCero: false,
    nivel: 3
  };

  // Datos para los informes (simulados - en producción vendrían del backend)
  cuentasBalance: CuentaBalance[] = [
    // ACTIVOS
    { codigo: '1', nombre: 'ACTIVOS', tipo: 'ACTIVO', nivel: 1, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 95000 },
    { codigo: '11', nombre: 'ACTIVO CORRIENTE', tipo: 'ACTIVO', nivel: 2, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 85000 },
    { codigo: '1101', nombre: 'Caja y Bancos', tipo: 'ACTIVO', nivel: 3, saldoDeudor: 55000, saldoAcreedor: 0, saldoFinal: 55000 },
    { codigo: '110101', nombre: 'Caja Moneda Nacional', tipo: 'ACTIVO', nivel: 4, saldoDeudor: 15000, saldoAcreedor: 0, saldoFinal: 15000 },
    { codigo: '110102', nombre: 'Banco Mercantil Santa Cruz', tipo: 'ACTIVO', nivel: 4, saldoDeudor: 40000, saldoAcreedor: 0, saldoFinal: 40000 },
    { codigo: '1102', nombre: 'Cuentas por Cobrar', tipo: 'ACTIVO', nivel: 3, saldoDeudor: 30000, saldoAcreedor: 0, saldoFinal: 30000 },
    { codigo: '110201', nombre: 'Clientes', tipo: 'ACTIVO', nivel: 4, saldoDeudor: 25000, saldoAcreedor: 0, saldoFinal: 25000 },
    { codigo: '110202', nombre: 'Otras Cuentas por Cobrar', tipo: 'ACTIVO', nivel: 4, saldoDeudor: 5000, saldoAcreedor: 0, saldoFinal: 5000 },
    
    { codigo: '12', nombre: 'ACTIVO NO CORRIENTE', tipo: 'ACTIVO', nivel: 2, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 10000 },
    { codigo: '1201', nombre: 'Propiedad, Planta y Equipo', tipo: 'ACTIVO', nivel: 3, saldoDeudor: 15000, saldoAcreedor: 5000, saldoFinal: 10000 },
    { codigo: '120101', nombre: 'Equipos de Oficina', tipo: 'ACTIVO', nivel: 4, saldoDeudor: 15000, saldoAcreedor: 0, saldoFinal: 15000 },
    { codigo: '120102', nombre: 'Depreciación Acumulada', tipo: 'ACTIVO', nivel: 4, saldoDeudor: 0, saldoAcreedor: 5000, saldoFinal: -5000 },

    // PASIVOS
    { codigo: '2', nombre: 'PASIVOS', tipo: 'PASIVO', nivel: 1, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 25000 },
    { codigo: '21', nombre: 'PASIVO CORRIENTE', tipo: 'PASIVO', nivel: 2, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 20000 },
    { codigo: '2101', nombre: 'Cuentas por Pagar', tipo: 'PASIVO', nivel: 3, saldoDeudor: 0, saldoAcreedor: 15000, saldoFinal: 15000 },
    { codigo: '210101', nombre: 'Proveedores', tipo: 'PASIVO', nivel: 4, saldoDeudor: 0, saldoAcreedor: 12000, saldoFinal: 12000 },
    { codigo: '210102', nombre: 'Acreedores Varios', tipo: 'PASIVO', nivel: 4, saldoDeudor: 0, saldoAcreedor: 3000, saldoFinal: 3000 },
    { codigo: '2102', nombre: 'Obligaciones Fiscales', tipo: 'PASIVO', nivel: 3, saldoDeudor: 0, saldoAcreedor: 5000, saldoFinal: 5000 },
    
    { codigo: '22', nombre: 'PASIVO NO CORRIENTE', tipo: 'PASIVO', nivel: 2, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 5000 },
    { codigo: '2201', nombre: 'Préstamos a Largo Plazo', tipo: 'PASIVO', nivel: 3, saldoDeudor: 0, saldoAcreedor: 5000, saldoFinal: 5000 },

    // PATRIMONIO
    { codigo: '3', nombre: 'PATRIMONIO', tipo: 'PATRIMONIO', nivel: 1, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 70000 },
    { codigo: '3101', nombre: 'Capital Social', tipo: 'PATRIMONIO', nivel: 2, saldoDeudor: 0, saldoAcreedor: 50000, saldoFinal: 50000 },
    { codigo: '3201', nombre: 'Resultados Acumulados', tipo: 'PATRIMONIO', nivel: 2, saldoDeudor: 0, saldoAcreedor: 10000, saldoFinal: 10000 },
    { codigo: '3301', nombre: 'Resultado del Ejercicio', tipo: 'PATRIMONIO', nivel: 2, saldoDeudor: 0, saldoAcreedor: 10000, saldoFinal: 10000 },

    // INGRESOS
    { codigo: '4', nombre: 'INGRESOS', tipo: 'INGRESO', nivel: 1, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 45000 },
    { codigo: '4101', nombre: 'Ingresos por Servicios', tipo: 'INGRESO', nivel: 2, saldoDeudor: 0, saldoAcreedor: 45000, saldoFinal: 45000 },
    { codigo: '410101', nombre: 'Servicios Contables', tipo: 'INGRESO', nivel: 3, saldoDeudor: 0, saldoAcreedor: 30000, saldoFinal: 30000 },
    { codigo: '410102', nombre: 'Consultoría Financiera', tipo: 'INGRESO', nivel: 3, saldoDeudor: 0, saldoAcreedor: 15000, saldoFinal: 15000 },

    // EGRESOS
    { codigo: '5', nombre: 'EGRESOS', tipo: 'EGRESO', nivel: 1, saldoDeudor: 0, saldoAcreedor: 0, saldoFinal: 35000 },
    { codigo: '5101', nombre: 'Gastos Operativos', tipo: 'EGRESO', nivel: 2, saldoDeudor: 30000, saldoAcreedor: 0, saldoFinal: 30000 },
    { codigo: '510101', nombre: 'Sueldos y Salarios', tipo: 'EGRESO', nivel: 3, saldoDeudor: 20000, saldoAcreedor: 0, saldoFinal: 20000 },
    { codigo: '510102', nombre: 'Servicios Básicos', tipo: 'EGRESO', nivel: 3, saldoDeudor: 5000, saldoAcreedor: 0, saldoFinal: 5000 },
    { codigo: '510103', nombre: 'Material de Oficina', tipo: 'EGRESO', nivel: 3, saldoDeudor: 3000, saldoAcreedor: 0, saldoFinal: 3000 },
    { codigo: '510104', nombre: 'Alquileres', tipo: 'EGRESO', nivel: 3, saldoDeudor: 2000, saldoAcreedor: 0, saldoFinal: 2000 },
    { codigo: '5102', nombre: 'Gastos Financieros', tipo: 'EGRESO', nivel: 2, saldoDeudor: 5000, saldoAcreedor: 0, saldoFinal: 5000 },
    { codigo: '510201', nombre: 'Intereses Pagados', tipo: 'EGRESO', nivel: 3, saldoDeudor: 3000, saldoAcreedor: 0, saldoFinal: 3000 },
    { codigo: '510202', nombre: 'Comisiones Bancarias', tipo: 'EGRESO', nivel: 3, saldoDeudor: 2000, saldoAcreedor: 0, saldoFinal: 2000 }
  ];

  // Asientos contables para el libro diario
  asientos: AsientoContable[] = [
    {
      id: 1, fecha: '2024-09-01', referencia: 'AST001', descripcion: 'Asiento de apertura',
      totalDebito: 70000, totalCredito: 70000,
      detalles: [
        { codigoCuenta: '110101', nombreCuenta: 'Caja Moneda Nacional', descripcion: 'Apertura de caja', debito: 15000, credito: 0 },
        { codigoCuenta: '110102', nombreCuenta: 'Banco Mercantil Santa Cruz', descripcion: 'Apertura cuenta bancaria', debito: 40000, credito: 0 },
        { codigoCuenta: '110201', nombreCuenta: 'Clientes', descripcion: 'Saldos iniciales clientes', debito: 25000, credito: 0 },
        { codigoCuenta: '3101', nombreCuenta: 'Capital Social', descripcion: 'Capital inicial', debito: 0, credito: 50000 },
        { codigoCuenta: '3201', nombreCuenta: 'Resultados Acumulados', descripcion: 'Utilidades anteriores', debito: 0, credito: 10000 },
        { codigoCuenta: '210101', nombreCuenta: 'Proveedores', descripcion: 'Saldos iniciales proveedores', debito: 0, credito: 12000 }
      ]
    },
    {
      id: 2, fecha: '2024-09-15', referencia: 'AST002', descripcion: 'Registro de ingresos por servicios',
      totalDebito: 5000, totalCredito: 5000,
      detalles: [
        { codigoCuenta: '110201', nombreCuenta: 'Clientes', descripcion: 'Facturación servicios contables', debito: 5000, credito: 0 },
        { codigoCuenta: '410101', nombreCuenta: 'Servicios Contables', descripcion: 'Ingresos por servicios', debito: 0, credito: 5000 }
      ]
    },
    {
      id: 3, fecha: '2024-09-20', referencia: 'AST003', descripcion: 'Pago de salarios',
      totalDebito: 8000, totalCredito: 8000,
      detalles: [
        { codigoCuenta: '510101', nombreCuenta: 'Sueldos y Salarios', descripcion: 'Pago nómina septiembre', debito: 8000, credito: 0 },
        { codigoCuenta: '110101', nombreCuenta: 'Caja Moneda Nacional', descripcion: 'Pago en efectivo', debito: 0, credito: 8000 }
      ]
    }
  ];

  // Métricas del dashboard
  metricas = {
    totalActivos: 0,
    totalPasivos: 0,
    totalPatrimonio: 0,
    utilidadNeta: 0,
    liquidez: 0,
    rentabilidad: 0
  };

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.calcularMetricas();
    console.log('📊 Módulo Informes Financieros iniciado');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startModuleAnimation();
    }, 300);
  }

  startModuleAnimation(): void {
    console.log('🎨 Animando módulo Informes Financieros...');

    anime({
      targets: this.container.nativeElement,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      easing: 'easeOutCubic'
    });

    // Animar métricas
    anime({
      targets: '.metric-card',
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 600,
      delay: anime.stagger(100, {start: 400}),
      easing: 'easeOutBack'
    });
  }

  // Navegación
  cambiarVista(vista: 'dashboard' | 'balance' | 'resultados' | 'diario' | 'mayor'): void {
    this.vistaActual = vista;
    this.parametros.tipoReporte = vista === 'dashboard' ? 'balance' : vista;
    
    anime({
      targets: '.content-area',
      opacity: [1, 0],
      duration: 200,
      complete: () => {
        anime({
          targets: '.content-area',
          opacity: [0, 1],
          duration: 300,
          easing: 'easeOutCubic'
        });
      }
    });
  }

  // Cálculos
  calcularMetricas(): void {
    this.metricas.totalActivos = this.cuentasBalance
      .filter(c => c.tipo === 'ACTIVO' && c.nivel === 1)
      .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);

    this.metricas.totalPasivos = this.cuentasBalance
      .filter(c => c.tipo === 'PASIVO' && c.nivel === 1)
      .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);

    this.metricas.totalPatrimonio = this.cuentasBalance
      .filter(c => c.tipo === 'PATRIMONIO' && c.nivel === 1)
      .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);

    const ingresos = this.cuentasBalance
      .filter(c => c.tipo === 'INGRESO')
      .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);

    const egresos = this.cuentasBalance
      .filter(c => c.tipo === 'EGRESO')
      .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);

    this.metricas.utilidadNeta = ingresos - egresos;

    // Ratios financieros
    const activoCorriente = this.cuentasBalance
      .filter(c => c.codigo === '11')
      .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);

    const pasivoCorriente = this.cuentasBalance
      .filter(c => c.codigo === '21')
      .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);

    this.metricas.liquidez = pasivoCorriente > 0 ? activoCorriente / pasivoCorriente : 0;
    this.metricas.rentabilidad = this.metricas.totalActivos > 0 ? 
      (this.metricas.utilidadNeta / this.metricas.totalActivos) * 100 : 0;
  }

  // Generar reportes
  generarBalance(): CuentaBalance[] {
    return this.cuentasBalance
      .filter(c => ['ACTIVO', 'PASIVO', 'PATRIMONIO'].includes(c.tipo))
      .filter(c => this.parametros.incluirCuentasCero || c.saldoFinal !== 0)
      .filter(c => c.nivel <= this.parametros.nivel);
  }

  generarEstadoResultados(): CuentaBalance[] {
    return this.cuentasBalance
      .filter(c => ['INGRESO', 'EGRESO'].includes(c.tipo))
      .filter(c => this.parametros.incluirCuentasCero || c.saldoFinal !== 0)
      .filter(c => c.nivel <= this.parametros.nivel);
  }

  // Método para exponer Math.abs al template
abs(value: number): number {
  return Math.abs(value);
}

// Métodos para filtrar cuentas por tipo en el Balance
getActivosBalance(): CuentaBalance[] {
  return this.generarBalance().filter(c => c.tipo === 'ACTIVO');
}

getPasivosBalance(): CuentaBalance[] {
  return this.generarBalance().filter(c => c.tipo === 'PASIVO');
}

getPatrimonioBalance(): CuentaBalance[] {
  return this.generarBalance().filter(c => c.tipo === 'PATRIMONIO');
}

// Métodos para filtrar cuentas en Estado de Resultados
getIngresosResultados(): CuentaBalance[] {
  return this.generarEstadoResultados().filter(c => c.tipo === 'INGRESO');
}

getEgresosResultados(): CuentaBalance[] {
  return this.generarEstadoResultados().filter(c => c.tipo === 'EGRESO');
}

// Métodos para calcular totales
getTotalIngresos(): number {
  return this.generarEstadoResultados()
    .filter(c => c.tipo === 'INGRESO')
    .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);
}

getTotalEgresos(): number {
  return this.generarEstadoResultados()
    .filter(c => c.tipo === 'EGRESO')
    .reduce((total, c) => total + Math.abs(c.saldoFinal), 0);
}

// Método para filtrar cuentas del libro mayor
getCuentasMayor(): CuentaBalance[] {
  return this.cuentasBalance.filter(c => 
    c.nivel <= this.parametros.nivel && 
    (this.parametros.incluirCuentasCero || c.saldoFinal !== 0)
  );
}

  generarLibroDiario(): AsientoContable[] {
    return this.asientos.filter(a => 
      a.fecha >= this.parametros.fechaInicio && 
      a.fecha <= this.parametros.fechaFin
    );
  }

  // Utilidades
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  }

  getIndentStyle(nivel: number): string {
    return `${(nivel - 1) * 20}px`;
  }

  getTipoColorClass(tipo: string): string {
    switch (tipo) {
      case 'ACTIVO': return 'tipo-activo';
      case 'PASIVO': return 'tipo-pasivo';
      case 'PATRIMONIO': return 'tipo-patrimonio';
      case 'INGRESO': return 'tipo-ingreso';
      case 'EGRESO': return 'tipo-egreso';
      default: return '';
    }
  }

  exportarPDF(): void {
    console.log('📄 Exportando a PDF...');
    // Implementar exportación a PDF
  }

  exportarExcel(): void {
    console.log('📊 Exportando a Excel...');
    // Implementar exportación a Excel
  }

  imprimirReporte(): void {
    window.print();
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';
import { ExportService } from '../export/export.service';
import {
  ContabilidadService,
  CuentaBalance,
  MetricasFinancieras,
  AsientoVista,
} from '../contabilidad/contabilidad.service';

declare var anime: any;

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
  styleUrls: ['./informes-financieros.css'],
})
export class InformesFinancierosComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;

  vistaActual: 'dashboard' | 'balance' | 'resultados' | 'diario' | 'mayor' = 'dashboard';

  parametros: ParametrosReporte = {
    fechaInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    fechaFin:    new Date().toISOString().split('T')[0],
    tipoReporte: 'balance',
    incluirCuentasCero: false,
    nivel: 3,
  };

  // ── Datos desde Supabase ─────────────────────────────────
  cuentasBalance: CuentaBalance[]      = [];
  asientos:       AsientoVista[]       = [];
  metricas:       MetricasFinancieras  = {
    totalActivos: 0, totalPasivos: 0, totalPatrimonio: 0,
    utilidadNeta: 0, liquidez: 0, rentabilidad: 0,
  };

  cargando  = false;
  errorMsg  = '';

  private get empresaInfo() {
    return {
      nombre:    this.authService.currentUserValue?.empresa || 'NUMIX',
      nit:       '123456789',
      direccion: 'La Paz, Bolivia',
    };
  }

  constructor(
    public authService: AuthService,
    private router: Router,
    private exportService: ExportService,
    private contabilidadService: ContabilidadService,
  ) {}

  // ══════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.startModuleAnimation(), 300);
  }

  startModuleAnimation(): void {
    if (!this.container?.nativeElement) return;
    anime({ targets: this.container.nativeElement, opacity: [0, 1], translateY: [30, 0], duration: 800, easing: 'easeOutCubic' });
    anime({ targets: '.metric-card', scale: [0.8, 1], opacity: [0, 1], duration: 600, delay: anime.stagger(100, { start: 400 }), easing: 'easeOutBack' });
  }

  // ══════════════════════════════════════════════════════
  // CARGA DE DATOS
  // ══════════════════════════════════════════════════════

  async cargarDatos(): Promise<void> {
    const empresaId = this.authService.empresaId;
    if (!empresaId) return;

    this.cargando = true;
    this.errorMsg = '';

    try {
      // Cargar saldos de cuentas en el período seleccionado
      this.cuentasBalance = await this.contabilidadService.getSaldosCuentas(
        empresaId,
        this.parametros.fechaInicio,
        this.parametros.fechaFin,
      );

      // Cargar asientos para Libro Diario / Mayor
      this.asientos = await this.contabilidadService.getAsientos(
        empresaId,
        this.parametros.fechaInicio,
        this.parametros.fechaFin,
      );

      // Calcular métricas financieras
      this.metricas = this.contabilidadService.calcularMetricas(this.cuentasBalance);

    } catch (err: any) {
      this.errorMsg = 'Error cargando datos: ' + (err.message || err);
      console.error(err);
    } finally {
      this.cargando = false;
    }
  }

  // ══════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ══════════════════════════════════════════════════════

  cambiarVista(vista: 'dashboard' | 'balance' | 'resultados' | 'diario' | 'mayor'): void {
    this.vistaActual = vista;
    this.parametros.tipoReporte = vista === 'dashboard' ? 'balance' : vista;

    // Recargar si se cambian parámetros
    anime({
      targets: '.content-area',
      opacity: [0, 1], translateY: [10, 0],
      duration: 400, easing: 'easeOutCubic',
    });
  }

  aplicarParametros(): void {
    this.cargarDatos();
  }

  // ══════════════════════════════════════════════════════
  // FILTROS PARA VISTAS
  // ══════════════════════════════════════════════════════

  private filtrarPorNivelYCero(lista: CuentaBalance[]): CuentaBalance[] {
    return lista.filter(c =>
      c.nivel <= this.parametros.nivel &&
      (this.parametros.incluirCuentasCero || c.saldoFinal !== 0)
    );
  }

  generarBalance():          CuentaBalance[] { return this.filtrarPorNivelYCero(this.cuentasBalance.filter(c => ['ACTIVO','PASIVO','PATRIMONIO'].includes(c.tipo))); }
  generarEstadoResultados(): CuentaBalance[] { return this.filtrarPorNivelYCero(this.cuentasBalance.filter(c => ['INGRESO','EGRESO'].includes(c.tipo))); }
  generarLibroDiario():      AsientoVista[]  { return this.asientos; }

  getActivosBalance():     CuentaBalance[] { return this.generarBalance().filter(c => c.tipo === 'ACTIVO'); }
  getPasivosBalance():     CuentaBalance[] { return this.generarBalance().filter(c => c.tipo === 'PASIVO'); }
  getPatrimonioBalance():  CuentaBalance[] { return this.generarBalance().filter(c => c.tipo === 'PATRIMONIO'); }
  getIngresosResultados(): CuentaBalance[] { return this.generarEstadoResultados().filter(c => c.tipo === 'INGRESO'); }
  getEgresosResultados():  CuentaBalance[] { return this.generarEstadoResultados().filter(c => c.tipo === 'EGRESO'); }
  getCuentasMayor():       CuentaBalance[] { return this.filtrarPorNivelYCero(this.cuentasBalance); }

  getTotalIngresos(): number { return this.getIngresosResultados().reduce((t, c) => t + Math.abs(c.saldoFinal), 0); }
  getTotalEgresos():  number { return this.getEgresosResultados().reduce((t,  c) => t + Math.abs(c.saldoFinal), 0); }

  // Movimientos de un asiento que afectan a una cuenta específica
  getMovimientosCuenta(codigoCuenta: string): { asiento: AsientoVista; detalle: any }[] {
    const result: { asiento: AsientoVista; detalle: any }[] = [];
    for (const asiento of this.asientos) {
      for (const detalle of asiento.detalles) {
        if (detalle.codigoCuenta === codigoCuenta) {
          result.push({ asiento, detalle });
        }
      }
    }
    return result;
  }

  // ══════════════════════════════════════════════════════
  // EXPORTACIONES
  // ══════════════════════════════════════════════════════

  exportarPDF(): void {
    switch (this.vistaActual) {
      case 'balance':
        this.exportService.exportBalanceGeneralPDF({
          empresa:         this.empresaInfo,
          fecha:           this.parametros.fechaFin,
          activos:         this.getActivosBalance().map(c  => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          pasivos:         this.getPasivosBalance().map(c  => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          patrimonio:      this.getPatrimonioBalance().map(c => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          totalActivos:    this.metricas.totalActivos,
          totalPasivos:    this.metricas.totalPasivos,
          totalPatrimonio: this.metricas.totalPatrimonio,
        });
        break;

      case 'resultados':
        this.exportService.exportEstadoResultadosPDF({
          empresa:       this.empresaInfo,
          periodo:       `Del ${this.parametros.fechaInicio} al ${this.parametros.fechaFin}`,
          ingresos:      this.getIngresosResultados().map(c => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          costos:        [],
          gastos:        this.getEgresosResultados().map(c  => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          totalIngresos: this.getTotalIngresos(),
          totalCostos:   0,
          totalGastos:   this.getTotalEgresos(),
          utilidadBruta: this.getTotalIngresos(),
          utilidadNeta:  this.metricas.utilidadNeta,
        });
        break;

      case 'diario':
        this.exportService.exportLibroDiarioPDF({
          empresa: this.empresaInfo,
          periodo: `Del ${this.parametros.fechaInicio} al ${this.parametros.fechaFin}`,
          asientos: this.generarLibroDiario().map(a => ({
            numero:      a.referencia,
            fecha:       a.fecha,
            descripcion: a.descripcion,
            detalles:    a.detalles.map(d => ({ cuenta: d.codigoCuenta, nombre: d.nombreCuenta, debe: d.debito, haber: d.credito })),
          })),
        });
        break;

      default:
        this.exportService.exportBalanceComprobacionPDF({
          empresa: this.empresaInfo,
          periodo: `Del ${this.parametros.fechaInicio} al ${this.parametros.fechaFin}`,
          cuentas: this.getCuentasMayor().map(c => ({
            codigo:        c.codigo,
            nombre:        c.nombre,
            sumasDebe:     c.saldoDeudor,
            sumasHaber:    c.saldoAcreedor,
            saldoDeudor:   c.saldoDeudor  > c.saldoAcreedor ? c.saldoDeudor  - c.saldoAcreedor : 0,
            saldoAcreedor: c.saldoAcreedor > c.saldoDeudor  ? c.saldoAcreedor - c.saldoDeudor  : 0,
          })),
        });
    }
  }

  exportarExcel(): void {
    switch (this.vistaActual) {
      case 'balance':
        this.exportService.exportBalanceGeneralExcel({
          fecha:           this.parametros.fechaFin,
          activos:         this.getActivosBalance().map(c  => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          pasivos:         this.getPasivosBalance().map(c  => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          patrimonio:      this.getPatrimonioBalance().map(c => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          totalActivos:    this.metricas.totalActivos,
          totalPasivos:    this.metricas.totalPasivos,
          totalPatrimonio: this.metricas.totalPatrimonio,
        });
        break;

      case 'resultados':
        this.exportService.exportEstadoResultadosExcel({
          ingresos:      this.getIngresosResultados().map(c => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          costos:        [],
          gastos:        this.getEgresosResultados().map(c  => ({ codigo: c.codigo, nombre: c.nombre, saldo: Math.abs(c.saldoFinal) })),
          totalIngresos: this.getTotalIngresos(),
          totalCostos:   0,
          totalGastos:   this.getTotalEgresos(),
          utilidadBruta: this.getTotalIngresos(),
          utilidadNeta:  this.metricas.utilidadNeta,
        });
        break;

      case 'diario':
        this.exportService.exportLibroDiarioExcel({
          periodo: `Del ${this.parametros.fechaInicio} al ${this.parametros.fechaFin}`,
          asientos: this.generarLibroDiario().map(a => ({
            numero:      a.referencia,
            fecha:       a.fecha,
            descripcion: a.descripcion,
            detalles:    a.detalles.map(d => ({ cuenta: d.codigoCuenta, nombre: d.nombreCuenta, debe: d.debito, haber: d.credito })),
          })),
        });
        break;

      default:
        this.exportService.exportBalanceComprobacionExcel({
          periodo: `Del ${this.parametros.fechaInicio} al ${this.parametros.fechaFin}`,
          cuentas: this.getCuentasMayor().map(c => ({
            codigo:        c.codigo,
            nombre:        c.nombre,
            sumasDebe:     c.saldoDeudor,
            sumasHaber:    c.saldoAcreedor,
            saldoDeudor:   c.saldoDeudor  > c.saldoAcreedor ? c.saldoDeudor  - c.saldoAcreedor : 0,
            saldoAcreedor: c.saldoAcreedor > c.saldoDeudor  ? c.saldoAcreedor - c.saldoDeudor  : 0,
          })),
        });
    }
  }

  imprimirReporte(): void { window.print(); }
  volverDashboard():  void { this.router.navigate(['/dashboard']); }

  // ══════════════════════════════════════════════════════
  // UTILIDADES
  // ══════════════════════════════════════════════════════

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount || 0);
  }

  abs(v: number): number { return Math.abs(v); }

  getIndentStyle(nivel: number): string { return `${(nivel - 1) * 20}px`; }

  getTipoColorClass(tipo: string): string {
    const map: Record<string, string> = {
      ACTIVO: 'tipo-activo', PASIVO: 'tipo-pasivo',
      PATRIMONIO: 'tipo-patrimonio', INGRESO: 'tipo-ingreso', EGRESO: 'tipo-egreso',
    };
    return map[tipo] || '';
  }
}
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';
import {
  ContabilidadService,
  CuentaContable,
  AsientoVista,
  DetalleVista,
} from '../contabilidad/contabilidad.service';

declare var anime: any;

@Component({
  selector: 'app-libro-mayor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './libro-mayor.html',
  styleUrls: ['./libro-mayor.css'],
})
export class LibroMayorComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;

  // ── Estado de la vista ──────────────────────────────────
  vistaActual: 'plan-cuentas' | 'asientos' | 'nuevo-asiento' = 'plan-cuentas';

  // ── Datos ───────────────────────────────────────────────
  planCuentas:     CuentaContable[] = [];
  cuentasFiltradas: CuentaContable[] = [];
  asientos:        AsientoVista[]   = [];

  // ── Filtros ─────────────────────────────────────────────
  busquedaCuenta   = '';
  filtroTipoCuenta = '';

  // ── Estado de carga ─────────────────────────────────────
  cargandoCuentas  = false;
  cargandoAsientos = false;
  guardando        = false;
  errorMsg         = '';
  successMsg       = '';

  // ── Formulario nuevo asiento ────────────────────────────
  nuevoAsiento = this.asientoVacio();
  nuevoDetalle = this.detalleVacio();

  constructor(
    public authService: AuthService,
    private router: Router,
    private contabilidadService: ContabilidadService
  ) {}

  get empresaId(): string {
    return this.authService.empresaId;
  }

  get usuarioId(): string {
    return this.authService.currentUserValue?.id || '';
  }

  // ══════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarPlanCuentas();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.startModuleAnimation(), 300);
  }

  startModuleAnimation(): void {
    if (!this.container?.nativeElement) return;
    anime({
      targets: this.container.nativeElement,
      opacity: [0, 1], translateY: [30, 0],
      duration: 800, easing: 'easeOutCubic',
    });
  }

  // ══════════════════════════════════════════════════════
  // CARGA DE DATOS
  // ══════════════════════════════════════════════════════

  async cargarPlanCuentas(): Promise<void> {
    if (!this.empresaId) return;
    this.cargandoCuentas = true;
    this.errorMsg = '';
    try {
      this.planCuentas     = await this.contabilidadService.getPlanCuentas(this.empresaId);
      this.cuentasFiltradas = [...this.planCuentas];
    } catch (err: any) {
      this.errorMsg = 'Error cargando plan de cuentas: ' + (err.message || err);
    } finally {
      this.cargandoCuentas = false;
    }
  }

  async cargarAsientos(): Promise<void> {
    if (!this.empresaId) return;
    this.cargandoAsientos = true;
    this.errorMsg = '';
    try {
      this.asientos = await this.contabilidadService.getAsientos(this.empresaId);
    } catch (err: any) {
      this.errorMsg = 'Error cargando asientos: ' + (err.message || err);
    } finally {
      this.cargandoAsientos = false;
    }
  }

  // ══════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ══════════════════════════════════════════════════════

  cambiarVista(vista: 'plan-cuentas' | 'asientos' | 'nuevo-asiento'): void {
    this.vistaActual = vista;
    this.errorMsg    = '';
    this.successMsg  = '';

    if (vista === 'asientos' && this.asientos.length === 0) {
      this.cargarAsientos();
    }
    if (vista === 'nuevo-asiento' && this.planCuentas.length === 0) {
      this.cargarPlanCuentas();
    }

    anime({
      targets: '.content-area',
      opacity: [0, 1], translateY: [10, 0],
      duration: 400, easing: 'easeOutCubic',
    });
  }

  // ══════════════════════════════════════════════════════
  // PLAN DE CUENTAS — filtrado
  // ══════════════════════════════════════════════════════

  filtrarCuentas(): void {
    let lista = [...this.planCuentas];

    if (this.busquedaCuenta) {
      const q = this.busquedaCuenta.toLowerCase();
      lista = lista.filter(c =>
        c.codigo.toLowerCase().includes(q) ||
        c.nombre.toLowerCase().includes(q)
      );
    }

    if (this.filtroTipoCuenta) {
      lista = lista.filter(c => c.tipo === this.filtroTipoCuenta);
    }

    this.cuentasFiltradas = lista;
  }

  // ══════════════════════════════════════════════════════
  // NUEVO ASIENTO
  // ══════════════════════════════════════════════════════

  onCuentaSeleccionada(): void {
    const cuenta = this.planCuentas.find(c => c.id === this.nuevoDetalle.codigoCuenta);
    if (cuenta) {
      this.nuevoDetalle.nombreCuenta = cuenta.nombre;
    }
  }

  agregarDetalle(): void {
    if (!this.nuevoDetalle.codigoCuenta) {
      this.errorMsg = 'Seleccione una cuenta';
      return;
    }
    if (this.nuevoDetalle.debito === 0 && this.nuevoDetalle.credito === 0) {
      this.errorMsg = 'Ingrese un monto en Débito o Crédito';
      return;
    }

    const cuenta = this.planCuentas.find(c => c.id === this.nuevoDetalle.codigoCuenta);
    this.nuevoAsiento.detalles.push({
      codigoCuenta: cuenta?.codigo || '',
      nombreCuenta: cuenta?.nombre || '',
      descripcion:  this.nuevoDetalle.descripcion,
      debito:       this.nuevoDetalle.debito,
      credito:      this.nuevoDetalle.credito,
      // Guardamos el id de la cuenta para el INSERT
      id: this.nuevoDetalle.codigoCuenta,
    });

    this.calcularTotales();
    this.nuevoDetalle = this.detalleVacio();
    this.errorMsg     = '';
  }

  eliminarDetalle(index: number): void {
    this.nuevoAsiento.detalles.splice(index, 1);
    this.calcularTotales();
  }

  calcularTotales(): void {
    this.nuevoAsiento.totalDebito  = this.nuevoAsiento.detalles.reduce((s, d) => s + d.debito,  0);
    this.nuevoAsiento.totalCredito = this.nuevoAsiento.detalles.reduce((s, d) => s + d.credito, 0);
    this.nuevoAsiento.balanceado   =
      this.nuevoAsiento.totalDebito > 0 &&
      Math.abs(this.nuevoAsiento.totalDebito - this.nuevoAsiento.totalCredito) < 0.01;
  }

  async guardarAsiento(): Promise<void> {
    if (!this.nuevoAsiento.balanceado) {
      this.errorMsg = 'El asiento debe estar balanceado (Débito = Crédito)';
      return;
    }
    if (!this.nuevoAsiento.descripcion.trim()) {
      this.errorMsg = 'La descripción es obligatoria';
      return;
    }

    this.guardando = true;
    this.errorMsg  = '';

    try {
      // Mapear detalles: el campo 'id' guardamos temporalmente el cuenta_id
      const detalles = this.nuevoAsiento.detalles.map((d, i) => ({
        cuenta_id: d.id || '',    // id de plan_cuentas
        debe:      d.debito,
        haber:     d.credito,
        glosa:     d.descripcion || this.nuevoAsiento.descripcion,
        orden:     i + 1,
      }));

      await this.contabilidadService.createAsiento(
        this.empresaId,
        this.usuarioId,
        {
          fecha:       this.nuevoAsiento.fecha,
          descripcion: this.nuevoAsiento.descripcion,
        },
        detalles
      );

      this.successMsg = '✅ Asiento guardado correctamente';
      this.limpiarFormulario();
      await this.cargarAsientos();
      this.vistaActual = 'asientos';

    } catch (err: any) {
      this.errorMsg = '❌ Error guardando asiento: ' + (err.message || err);
    } finally {
      this.guardando = false;
    }
  }

  limpiarFormulario(): void {
    this.nuevoAsiento = this.asientoVacio();
    this.nuevoDetalle = this.detalleVacio();
    this.errorMsg     = '';
  }

  async anularAsiento(asiento: AsientoVista): Promise<void> {
    if (!confirm(`¿Anular el asiento ${asiento.referencia}?`)) return;
    try {
      await this.contabilidadService.anularAsiento(asiento.id);
      this.successMsg = '✅ Asiento anulado';
      await this.cargarAsientos();
    } catch (err: any) {
      this.errorMsg = '❌ Error anulando asiento: ' + (err.message || err);
    }
  }

  // ══════════════════════════════════════════════════════
  // UTILIDADES
  // ══════════════════════════════════════════════════════

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount || 0);
  }

  getIndentStyle(nivel: number): string {
    return `${(nivel - 1) * 20}px`;
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Sólo cuentas que aceptan movimientos para el selector
  get cuentasParaAsiento(): CuentaContable[] {
    return this.planCuentas.filter(c => c.acepta_movimientos && c.activo);
  }

  private asientoVacio() {
    return {
      fecha:        new Date().toISOString().split('T')[0],
      descripcion:  '',
      detalles:     [] as (DetalleVista & { id?: string })[],
      totalDebito:  0,
      totalCredito: 0,
      balanceado:   false,
    };
  }

  private detalleVacio() {
    return {
      codigoCuenta: '',  // aquí guardamos el UUID de plan_cuentas
      nombreCuenta: '',
      descripcion:  '',
      debito:       0,
      credito:      0,
    };
  }
}
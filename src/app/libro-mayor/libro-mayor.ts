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

export interface CuentaPUCT extends CuentaContable {
  c:  string;
  g:  string;
  sg: string;
  cp: string;
  ca: string;
}

// Modal modes
type ModalMode = 'crear' | 'editar' | null;

@Component({
  selector: 'app-libro-mayor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './libro-mayor.html',
  styleUrls: ['./libro-mayor.css'],
})
export class LibroMayorComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;

  vistaActual: 'plan-cuentas' | 'asientos' | 'nuevo-asiento' = 'plan-cuentas';

  planCuentas:      CuentaContable[] = [];
  cuentasPUCT:      CuentaPUCT[]    = [];
  cuentasFiltradas: CuentaPUCT[]    = [];
  asientos:         AsientoVista[]  = [];

  busquedaCuenta   = '';
  filtroTipoCuenta = '';
  filtroNivel      = '';

  cargandoCuentas  = false;
  cargandoAsientos = false;
  guardando        = false;
  guardandoCuenta  = false;
  errorMsg         = '';
  successMsg       = '';

  // ── CRUD Cuentas ─────────────────────────────────────
  modalMode:     ModalMode      = null;
  cuentaForm:    Partial<CuentaContable> = {};
  cuentaEditing: CuentaContable | null  = null;
  confirmDelete: CuentaContable | null  = null;

  readonly TIPOS:       string[] = ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'EGRESO'];
  readonly NATURALEZAS: string[] = ['DEUDORA', 'ACREEDORA'];

  // ── Nuevo Asiento ─────────────────────────────────────
  nuevoAsiento = this.asientoVacio();
  nuevoDetalle = this.detalleVacio();

  constructor(
    public authService: AuthService,
    private router: Router,
    private contabilidadService: ContabilidadService
  ) {}

  get empresaId(): string { return this.authService.empresaId; }
  get usuarioId(): string { return this.authService.currentUserValue?.id || ''; }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.cargarPlanCuentas();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.container?.nativeElement) {
        anime({ targets: this.container.nativeElement, opacity: [0,1], translateY: [30,0], duration: 800, easing: 'easeOutCubic' });
      }
    }, 300);
  }

  // ── Parsear código PUCT ──────────────────────────────
  parsearCodigo(codigo: string): { c: string; g: string; sg: string; cp: string; ca: string } {
    const s = codigo.trim();
    return {
      c:  s.length >= 1 ? s.slice(0, 1) : '',
      g:  s.length >= 3 ? s.slice(1, 3) : '',
      sg: s.length >= 5 ? s.slice(3, 5) : '',
      cp: s.length >= 7 ? s.slice(5, 7) : '',
      ca: s.length >  7 ? s.slice(7)    : '',
    };
  }

  private toCuentaPUCT(c: CuentaContable): CuentaPUCT {
    return { ...c, ...this.parsearCodigo(c.codigo) };
  }

  // ── Carga de datos ───────────────────────────────────
  async cargarPlanCuentas(): Promise<void> {
    if (!this.empresaId) return;
    this.cargandoCuentas = true;
    this.errorMsg = '';
    try {
      this.planCuentas      = await this.contabilidadService.getPlanCuentas(this.empresaId);
      this.cuentasPUCT      = this.planCuentas.map(c => this.toCuentaPUCT(c));
      this.cuentasFiltradas = [...this.cuentasPUCT];
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

  // ── Navegación ───────────────────────────────────────
  cambiarVista(vista: 'plan-cuentas' | 'asientos' | 'nuevo-asiento'): void {
    this.vistaActual = vista;
    this.errorMsg = ''; this.successMsg = '';
    if (vista === 'asientos'      && this.asientos.length    === 0) this.cargarAsientos();
    if (vista === 'nuevo-asiento' && this.planCuentas.length === 0) this.cargarPlanCuentas();
    anime({ targets: '.content-area', opacity: [0,1], translateY: [10,0], duration: 400, easing: 'easeOutCubic' });
  }

  // ── Filtrado ─────────────────────────────────────────
  filtrarCuentas(): void {
    let lista = [...this.cuentasPUCT];
    if (this.busquedaCuenta) {
      const q = this.busquedaCuenta.toLowerCase();
      lista = lista.filter(c => c.codigo.includes(q) || c.nombre.toLowerCase().includes(q));
    }
    if (this.filtroTipoCuenta) lista = lista.filter(c => c.tipo  === this.filtroTipoCuenta);
    if (this.filtroNivel)      lista = lista.filter(c => c.nivel === +this.filtroNivel);
    this.cuentasFiltradas = lista;
  }

  limpiarFiltros(): void {
    this.busquedaCuenta = ''; this.filtroTipoCuenta = ''; this.filtroNivel = '';
    this.cuentasFiltradas = [...this.cuentasPUCT];
  }

  // ── CRUD — Modal helpers ─────────────────────────────

  /** Abre el modal para crear una cuenta nueva. */
  abrirCrear(): void {
    this.cuentaEditing = null;
    this.cuentaForm = {
      codigo:             '',
      nombre:             '',
      tipo:               'ACTIVO',
      naturaleza:         'DEUDORA',
      nivel:              1,
      acepta_movimientos: false,
      activo:             true,
    };
    this.modalMode = 'crear';
    this.errorMsg = '';
    this._animarModal();
  }

  /** Abre el modal con los datos de la cuenta para editar. */
  abrirEditar(cuenta: CuentaContable): void {
    this.cuentaEditing = cuenta;
    this.cuentaForm = { ...cuenta };
    this.modalMode = 'editar';
    this.errorMsg = '';
    this._animarModal();
  }

  cerrarModal(): void {
    this.modalMode = null;
    this.cuentaEditing = null;
    this.cuentaForm = {};
    this.errorMsg = '';
  }

  /** Infiere el nivel automáticamente desde el código ingresado. */
  onCodigoChange(): void {
    const len = (this.cuentaForm.codigo || '').trim().length;
    if      (len <= 1) this.cuentaForm.nivel = 1;
    else if (len <= 3) this.cuentaForm.nivel = 2;
    else if (len <= 5) this.cuentaForm.nivel = 3;
    else if (len <= 7) this.cuentaForm.nivel = 4;
    else               this.cuentaForm.nivel = 5;
    // Nivel 5 (CA) = acepta movimientos por defecto
    if (this.cuentaForm.nivel === 5) this.cuentaForm.acepta_movimientos = true;
  }

  /** Guarda (crea o edita) la cuenta. */
  async guardarCuenta(): Promise<void> {
    if (!this._validarFormCuenta()) return;
    this.guardandoCuenta = true;
    this.errorMsg = '';
    try {
      if (this.modalMode === 'crear') {
        await this.contabilidadService.createCuenta(this.cuentaForm as Omit<CuentaContable, 'id'>);
        this.successMsg = '✅ Cuenta creada correctamente';
      } else if (this.modalMode === 'editar' && this.cuentaEditing) {
        await this.contabilidadService.updateCuenta(this.cuentaEditing.id!, this.cuentaForm);
        this.successMsg = '✅ Cuenta actualizada correctamente';
      }
      this.cerrarModal();
      await this.cargarPlanCuentas();
    } catch (err: any) {
      this.errorMsg = '❌ ' + (err.message || err);
    } finally {
      this.guardandoCuenta = false;
    }
  }

  /** Muestra el diálogo de confirmación para eliminar. */
  pedirConfirmDelete(cuenta: CuentaContable): void {
    this.confirmDelete = cuenta;
  }

  cancelarDelete(): void {
    this.confirmDelete = null;
  }

  async eliminarCuenta(): Promise<void> {
    if (!this.confirmDelete) return;
    const id = this.confirmDelete.id!;
    this.confirmDelete = null;
    this.errorMsg = '';
    try {
      await this.contabilidadService.deleteCuenta(id);
      this.successMsg = '✅ Cuenta eliminada';
      await this.cargarPlanCuentas();
    } catch (err: any) {
      this.errorMsg = '❌ ' + (err.message || err);
    }
  }

  private _validarFormCuenta(): boolean {
    if (!this.cuentaForm.codigo?.trim())  { this.errorMsg = 'El código es obligatorio'; return false; }
    if (!this.cuentaForm.nombre?.trim())  { this.errorMsg = 'El nombre es obligatorio'; return false; }
    if (!this.cuentaForm.tipo)            { this.errorMsg = 'El tipo es obligatorio';   return false; }
    if (!this.cuentaForm.naturaleza)      { this.errorMsg = 'La naturaleza es obligatoria'; return false; }
    // Verificar código duplicado solo al crear
    if (this.modalMode === 'crear') {
      const existe = this.planCuentas.some(c => c.codigo === this.cuentaForm.codigo!.trim());
      if (existe) { this.errorMsg = `El código ${this.cuentaForm.codigo} ya existe`; return false; }
    }
    return true;
  }

  private _animarModal(): void {
    setTimeout(() => {
      anime({ targets: '.cuenta-modal', opacity: [0,1], scale: [0.93,1], duration: 250, easing: 'easeOutCubic' });
    }, 10);
  }

  // ── Nuevo asiento ────────────────────────────────────
  onCuentaSeleccionada(): void {
    const c = this.planCuentas.find(c => c.id === this.nuevoDetalle.codigoCuenta);
    if (c) this.nuevoDetalle.nombreCuenta = c.nombre;
  }

  agregarDetalle(): void {
    if (!this.nuevoDetalle.codigoCuenta)                          { this.errorMsg = 'Seleccione una cuenta'; return; }
    if (!this.nuevoDetalle.debito && !this.nuevoDetalle.credito)  { this.errorMsg = 'Ingrese un monto'; return; }
    const cuenta = this.planCuentas.find(c => c.id === this.nuevoDetalle.codigoCuenta);
    this.nuevoAsiento.detalles.push({
      id:           this.nuevoDetalle.codigoCuenta,
      codigoCuenta: cuenta?.codigo || '',
      nombreCuenta: cuenta?.nombre || '',
      descripcion:  this.nuevoDetalle.descripcion,
      debito:       this.nuevoDetalle.debito,
      credito:      this.nuevoDetalle.credito,
    });
    this.calcularTotales();
    this.nuevoDetalle = this.detalleVacio();
    this.errorMsg = '';
  }

  eliminarDetalle(i: number): void { this.nuevoAsiento.detalles.splice(i, 1); this.calcularTotales(); }

  calcularTotales(): void {
    this.nuevoAsiento.totalDebito  = this.nuevoAsiento.detalles.reduce((s, d) => s + d.debito,  0);
    this.nuevoAsiento.totalCredito = this.nuevoAsiento.detalles.reduce((s, d) => s + d.credito, 0);
    this.nuevoAsiento.balanceado   =
      this.nuevoAsiento.totalDebito > 0 &&
      Math.abs(this.nuevoAsiento.totalDebito - this.nuevoAsiento.totalCredito) < 0.01;
  }

  async guardarAsiento(): Promise<void> {
    if (!this.nuevoAsiento.balanceado)         { this.errorMsg = 'El asiento debe estar balanceado'; return; }
    if (!this.nuevoAsiento.descripcion.trim()) { this.errorMsg = 'La descripción es obligatoria';   return; }
    this.guardando = true; this.errorMsg = '';
    try {
      await this.contabilidadService.createAsiento(
        this.empresaId, this.usuarioId,
        { fecha: this.nuevoAsiento.fecha, descripcion: this.nuevoAsiento.descripcion },
        this.nuevoAsiento.detalles.map((d, i) => ({
          cuenta_id: d.id || '', debe: d.debito, haber: d.credito,
          glosa: d.descripcion || this.nuevoAsiento.descripcion, orden: i + 1,
        }))
      );
      this.successMsg = '✅ Asiento guardado correctamente';
      this.limpiarFormulario();
      await this.cargarAsientos();
      this.vistaActual = 'asientos';
    } catch (err: any) {
      this.errorMsg = '❌ Error: ' + (err.message || err);
    } finally { this.guardando = false; }
  }

  limpiarFormulario(): void {
    this.nuevoAsiento = this.asientoVacio();
    this.nuevoDetalle = this.detalleVacio();
    this.errorMsg = '';
  }

  async anularAsiento(a: AsientoVista): Promise<void> {
    if (!confirm(`¿Anular el asiento ${a.referencia}?`)) return;
    try {
      await this.contabilidadService.anularAsiento(a.id);
      this.successMsg = '✅ Asiento anulado';
      await this.cargarAsientos();
    } catch (err: any) { this.errorMsg = '❌ Error: ' + (err.message || err); }
  }

  // ── Utilidades ───────────────────────────────────────
  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(v || 0);
  }
  volverDashboard(): void { this.router.navigate(['/dashboard']); }
  labelNivel(n: number): string { return ({ 1:'C', 2:'G', 3:'SG', 4:'CP', 5:'CA' } as any)[n] || ''; }

  get cuentasParaAsiento(): CuentaContable[] {
    return this.planCuentas.filter(c => c.acepta_movimientos && c.activo);
  }

  private asientoVacio() {
    return {
      fecha: new Date().toISOString().split('T')[0], descripcion: '',
      detalles: [] as (DetalleVista & { id?: string })[],
      totalDebito: 0, totalCredito: 0, balanceado: false,
    };
  }
  private detalleVacio() {
    return { codigoCuenta: '', nombreCuenta: '', descripcion: '', debito: 0, credito: 0 };
  }
}
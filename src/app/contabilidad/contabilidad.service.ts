import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../configuracion/services/supabase.service';

// ── Interfaces alineadas con la BD ───────────────────────────

export interface CuentaContable {
  id?: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'EGRESO';
  naturaleza: 'DEUDORA' | 'ACREEDORA';
  nivel: number;
  cuenta_padre_id?: string;
  acepta_movimientos: boolean;
  requiere_centro_costo: boolean;
  activo: boolean;
  // Calculado en frontend (no está en BD)
  saldo?: number;
}

export interface AsientoContable {
  id?: string;
  empresa_id: string;
  periodo_id?: string;
  numero_asiento?: string;
  fecha: string;
  descripcion: string;
  tipo?: string;
  referencia_id?: string;
  referencia_tipo?: string;
  glosa?: string;
  estado: 'BORRADOR' | 'CONFIRMADO' | 'ANULADO';
  creado_por?: string;
  aprobado_por?: string;
  fecha_aprobacion?: string;
  created_at?: string;
  // Joins
  detalles?: DetalleAsiento[];
}

export interface DetalleAsiento {
  id?: string;
  asiento_id?: string;
  cuenta_id: string;
  debe: number;
  haber: number;
  glosa?: string;
  orden?: number;
  // Join con plan_cuentas
  plan_cuentas?: { codigo: string; nombre: string };
}

// ── Interfaces para el componente (vista) ────────────────────

export interface AsientoVista {
  id: string;
  fecha: string;
  descripcion: string;
  referencia: string;
  detalles: DetalleVista[];
  totalDebito: number;
  totalCredito: number;
  balanceado: boolean;
  estado: 'BORRADOR' | 'CONFIRMADO' | 'ANULADO';
}

export interface DetalleVista {
  id?: string;
  codigoCuenta: string;
  nombreCuenta: string;
  descripcion: string;
  debito: number;
  credito: number;
}

// ── Interfaces para Informes ──────────────────────────────────

export interface CuentaBalance {
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'EGRESO';
  nivel: number;
  saldoDeudor: number;
  saldoAcreedor: number;
  saldoFinal: number;
}

export interface MetricasFinancieras {
  totalActivos: number;
  totalPasivos: number;
  totalPatrimonio: number;
  utilidadNeta: number;
  liquidez: number;
  rentabilidad: number;
}

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private supabaseService = inject(SupabaseService);
  private get db() { return this.supabaseService.client; }

  // ══════════════════════════════════════════════════════════
  // PLAN DE CUENTAS
  // ══════════════════════════════════════════════════════════

  async getPlanCuentas(empresaId: string): Promise<CuentaContable[]> {
    const { data, error } = await this.db
      .from('plan_cuentas')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('codigo');

    if (error) throw error;
    return (data || []).map(c => ({
      ...c,
      tipo: c.tipo?.toUpperCase() as CuentaContable['tipo'],
      naturaleza: c.naturaleza?.toUpperCase() as CuentaContable['naturaleza'],
      saldo: 0,
    }));
  }

  async createCuenta(cuenta: CuentaContable): Promise<CuentaContable> {
    const { data, error } = await this.db
      .from('plan_cuentas')
      .insert({
        empresa_id:              cuenta.empresa_id,
        codigo:                  cuenta.codigo,
        nombre:                  cuenta.nombre,
        tipo:                    cuenta.tipo,
        naturaleza:              cuenta.naturaleza,
        nivel:                   cuenta.nivel,
        cuenta_padre_id:         cuenta.cuenta_padre_id || null,
        acepta_movimientos:      cuenta.acepta_movimientos ?? true,
        requiere_centro_costo:   cuenta.requiere_centro_costo ?? false,
        activo:                  true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ══════════════════════════════════════════════════════════
  // ASIENTOS CONTABLES
  // ══════════════════════════════════════════════════════════

  async getAsientos(empresaId: string, fechaInicio?: string, fechaFin?: string): Promise<AsientoVista[]> {
    let query = this.db
      .from('asientos_contables')
      .select(`
        id, numero_asiento, fecha, descripcion, glosa, estado,
        detalle_asientos (
          id, cuenta_id, debe, haber, glosa, orden,
          plan_cuentas ( codigo, nombre )
        )
      `)
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })
      .order('numero_asiento', { ascending: false });

    if (fechaInicio) query = query.gte('fecha', fechaInicio);
    if (fechaFin)    query = query.lte('fecha', fechaFin);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(a => this.mapAsientoVista(a));
  }

  async createAsiento(
    empresaId: string,
    usuarioId: string,
    asiento: { fecha: string; descripcion: string; glosa?: string },
    detalles: { cuenta_id: string; debe: number; haber: number; glosa?: string; orden?: number }[]
  ): Promise<AsientoVista> {
    // 1. Generar número de asiento correlativo
    const numeroAsiento = await this.generarNumeroAsiento(empresaId);

    // 2. Insertar asiento cabecera
    const { data: cabecera, error: errCab } = await this.db
      .from('asientos_contables')
      .insert({
        empresa_id:     empresaId,
        numero_asiento: numeroAsiento,
        fecha:          asiento.fecha,
        descripcion:    asiento.descripcion,
        glosa:          asiento.glosa || asiento.descripcion,
        estado:         'CONFIRMADO',
        creado_por:     usuarioId,
      })
      .select()
      .single();

    if (errCab) throw errCab;

    // 3. Insertar detalles
    const detallesConAsiento = detalles.map((d, i) => ({
      asiento_id: cabecera.id,
      cuenta_id:  d.cuenta_id,
      debe:       d.debe,
      haber:      d.haber,
      glosa:      d.glosa || asiento.descripcion,
      orden:      d.orden ?? i + 1,
    }));

    const { error: errDet } = await this.db
      .from('detalle_asientos')
      .insert(detallesConAsiento);

    if (errDet) throw errDet;

    // 4. Retornar asiento completo
    const asientos = await this.getAsientos(empresaId);
    return asientos.find(a => a.id === cabecera.id)!;
  }

  async anularAsiento(asientoId: string): Promise<void> {
    const { error } = await this.db
      .from('asientos_contables')
      .update({ estado: 'ANULADO' })
      .eq('id', asientoId);

    if (error) throw error;
  }

  // ══════════════════════════════════════════════════════════
  // SALDOS DE CUENTAS (para Informes)
  // ══════════════════════════════════════════════════════════

  async getSaldosCuentas(
    empresaId: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<CuentaBalance[]> {
    // 1. Obtener plan de cuentas
    const cuentas = await this.getPlanCuentas(empresaId);

    // 2. Obtener todos los movimientos en el rango de fechas
    const { data: movimientos, error } = await this.db
      .from('detalle_asientos')
      .select(`
        cuenta_id, debe, haber,
        asientos_contables!inner ( fecha, estado, empresa_id )
      `)
      .eq('asientos_contables.empresa_id', empresaId)
      .eq('asientos_contables.estado', 'CONFIRMADO')
      .gte('asientos_contables.fecha', fechaInicio)
      .lte('asientos_contables.fecha', fechaFin);

    if (error) throw error;

    // 3. Calcular sumas por cuenta_id
    const sumasPorCuenta = new Map<string, { debe: number; haber: number }>();
    for (const mov of movimientos || []) {
      const prev = sumasPorCuenta.get(mov.cuenta_id) || { debe: 0, haber: 0 };
      sumasPorCuenta.set(mov.cuenta_id, {
        debe:  prev.debe  + (mov.debe  || 0),
        haber: prev.haber + (mov.haber || 0),
      });
    }

    // 4. Armar CuentaBalance con saldos
    return cuentas.map(c => {
      const sumas = sumasPorCuenta.get(c.id || '') || { debe: 0, haber: 0 };
      const saldoDeudor   = sumas.debe;
      const saldoAcreedor = sumas.haber;
      let saldoFinal: number;

      if (c.naturaleza === 'DEUDORA') {
        saldoFinal = saldoDeudor - saldoAcreedor;
      } else {
        saldoFinal = saldoAcreedor - saldoDeudor;
      }

      return {
        codigo:        c.codigo,
        nombre:        c.nombre,
        tipo:          c.tipo,
        nivel:         c.nivel,
        saldoDeudor,
        saldoAcreedor,
        saldoFinal,
      };
    });
  }

  calcularMetricas(cuentas: CuentaBalance[]): MetricasFinancieras {
    const sum = (tipo: string, nivel?: number) =>
      cuentas
        .filter(c => c.tipo === tipo && (nivel === undefined || c.nivel === nivel))
        .reduce((t, c) => t + Math.abs(c.saldoFinal), 0);

    const totalActivos    = sum('ACTIVO', 1);
    const totalPasivos    = sum('PASIVO', 1);
    const totalPatrimonio = sum('PATRIMONIO', 1);
    const totalIngresos   = sum('INGRESO');
    const totalEgresos    = sum('EGRESO');
    const utilidadNeta    = totalIngresos - totalEgresos;

    const activoCorriente = Math.abs(
      cuentas.find(c => c.codigo === '11')?.saldoFinal ?? 0
    );
    const pasivoCorriente = Math.abs(
      cuentas.find(c => c.codigo === '21')?.saldoFinal ?? 0
    );

    return {
      totalActivos,
      totalPasivos,
      totalPatrimonio,
      utilidadNeta,
      liquidez:      pasivoCorriente > 0 ? activoCorriente / pasivoCorriente : 0,
      rentabilidad:  totalActivos    > 0 ? (utilidadNeta / totalActivos) * 100 : 0,
    };
  }

  // ══════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════

  private async generarNumeroAsiento(empresaId: string): Promise<string> {
    const anio = new Date().getFullYear();
    const { count } = await this.db
      .from('asientos_contables')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    const correlativo = String((count || 0) + 1).padStart(4, '0');
    return `AST-${anio}-${correlativo}`;
  }

  private mapAsientoVista(a: any): AsientoVista {
    const detalles: DetalleVista[] = (a.detalle_asientos || [])
      .sort((x: any, y: any) => (x.orden || 0) - (y.orden || 0))
      .map((d: any) => ({
        id:           d.id,
        codigoCuenta: d.plan_cuentas?.codigo || '',
        nombreCuenta: d.plan_cuentas?.nombre || '',
        descripcion:  d.glosa || '',
        debito:       d.debe  || 0,
        credito:      d.haber || 0,
      }));

    const totalDebito  = detalles.reduce((s, d) => s + d.debito,  0);
    const totalCredito = detalles.reduce((s, d) => s + d.credito, 0);

    return {
      id:          a.id,
      fecha:       a.fecha,
      descripcion: a.descripcion || a.glosa || '',
      referencia:  a.numero_asiento || '',
      detalles,
      totalDebito,
      totalCredito,
      balanceado:  Math.abs(totalDebito - totalCredito) < 0.01,
      estado:      a.estado?.toUpperCase() as AsientoVista['estado'],
    };
  }
}
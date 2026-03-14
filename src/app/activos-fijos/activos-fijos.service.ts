import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../configuracion/services/supabase.service';

export interface ActivoFijo {
  id?: string;
  empresa_id: string;
  codigo: string;
  descripcion: string;
  categoria: 'inmueble'|'maquinaria'|'vehiculo'|'muebles_enseres'|'equipo_computo'|'equipo_comunicacion'|'otro';
  fecha_adquisicion: string;
  costo_historico: number;
  valor_residual: number;
  vida_util_anios: number;
  metodo_depreciacion: 'linea_recta'|'doble_saldo_decreciente'|'suma_digitos';
  tasa_depreciacion?: number;
  valor_libros_actual?: number;
  depreciacion_acumulada?: number;
  cuenta_activo_id?: string;
  cuenta_depreciacion_id?: string;
  cuenta_gasto_id?: string;
  ubicacion?: string;
  numero_serie?: string;
  proveedor?: string;
  activo: boolean;
}

// Tasas de depreciación Bolivia — DS 24051
export const TASAS_DEPRECIACION: Record<string, number> = {
  inmueble:            2.5,
  maquinaria:          12.5,
  vehiculo:            20,
  muebles_enseres:     10,
  equipo_computo:      25,
  equipo_comunicacion: 25,
  otro:                10,
};

@Injectable({ providedIn: 'root' })
export class ActivosFijosService {
  private supabaseService = inject(SupabaseService);
  private get db() { return this.supabaseService.client; }

  async getActivos(empresaId: string) {
    const { data, error } = await this.db
      .from('activos_fijos').select('*')
      .eq('empresa_id', empresaId).eq('activo', true).order('codigo');
    if (error) throw error;
    return data;
  }

  async createActivo(activo: ActivoFijo) {
    const tasa = TASAS_DEPRECIACION[activo.categoria] || 10;
    const { data, error } = await this.db
      .from('activos_fijos')
      .insert({
        ...activo,
        tasa_depreciacion: tasa,
        valor_libros_actual: activo.costo_historico,
        depreciacion_acumulada: 0,
      })
      .select().single();
    if (error) throw error;
    return data;
  }

  async updateActivo(id: string, activo: Partial<ActivoFijo>) {
    const { data, error } = await this.db
      .from('activos_fijos').update(activo).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async getUFV(fecha: string): Promise<number> {
    const { data } = await this.db
      .from('ufv_historico').select('valor_ufv')
      .lte('fecha', fecha).order('fecha', { ascending: false })
      .limit(1).single();
    return data?.valor_ufv || 1;
  }

  calcularDepreciacionMensual(activo: ActivoFijo, ufvInicio: number, ufvFin: number) {
    const valorLibros    = activo.valor_libros_actual || activo.costo_historico;
    const factorUfv      = ufvFin / ufvInicio;
    const valorActualizado = valorLibros * factorUfv;
    const actualizacion  = valorActualizado - valorLibros;
    const tasaMensual    = (activo.tasa_depreciacion || TASAS_DEPRECIACION[activo.categoria]) / 100 / 12;
    const baseDepreciable= valorActualizado - activo.valor_residual;
    const depreciacionPeriodo = Math.max(0, baseDepreciable * tasaMensual);
    const depreciacionAcumulada = (activo.depreciacion_acumulada || 0) + depreciacionPeriodo;
    const nuevoValorLibros = valorActualizado - depreciacionPeriodo;

    return {
      ufv_inicio: ufvInicio, ufv_fin: ufvFin,
      valor_inicial_ufv: valorLibros,
      valor_final_ufv: valorActualizado,
      actualizacion_valor: actualizacion,
      depreciacion_periodo: depreciacionPeriodo,
      depreciacion_acumulada: depreciacionAcumulada,
      valor_libros: nuevoValorLibros,
    };
  }

  async getDepreciaciones(activoId: string) {
    const { data, error } = await this.db
      .from('depreciaciones')
      .select('*, periodos_contables(mes, anio)')
      .eq('activo_id', activoId)
      .order('fecha', { ascending: false });
    if (error) throw error;
    return data;
  }

  async registrarDepreciacion(
    activoId: string, periodoId: string, fecha: string,
    calculo: ReturnType<ActivosFijosService['calcularDepreciacionMensual']>
  ) {
    const { data, error } = await this.db
      .from('depreciaciones')
      .insert({ activo_id: activoId, periodo_id: periodoId, fecha, ...calculo })
      .select().single();
    if (error) throw error;

    await this.db.from('activos_fijos').update({
      valor_libros_actual: calculo.valor_libros,
      depreciacion_acumulada: calculo.depreciacion_acumulada,
    }).eq('id', activoId);

    return data;
  }

  async insertarUFV(fecha: string, valor: number) {
    const { error } = await this.db
      .from('ufv_historico').upsert({ fecha, valor_ufv: valor }, { onConflict: 'fecha' });
    if (error) throw error;
  }
}

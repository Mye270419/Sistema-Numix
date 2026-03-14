import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../configuracion/services/supabase.service';

export interface Producto {
  id?: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'bien' | 'servicio' | 'activo';
  unidad_medida: string;
  precio_venta?: number;
  precio_compra?: number;
  controla_stock: boolean;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo?: number;
  activo: boolean;
}

export interface MovimientoKardex {
  empresa_id: string;
  producto_id: string;
  fecha: string;
  tipo_movimiento: 'entrada_compra'|'salida_venta'|'ajuste_entrada'|'ajuste_salida'|'devolucion_compra'|'devolucion_venta';
  cantidad: number;
  costo_unitario: number;
  glosa?: string;
  referencia_id?: string;
  referencia_tipo?: string;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private supabaseService = inject(SupabaseService);
  private get db() { return this.supabaseService.client; }

  async getProductos(empresaId: string) {
    const { data, error } = await this.db
      .from('productos').select('*')
      .eq('empresa_id', empresaId).eq('activo', true).order('nombre');
    if (error) throw error;
    return data;
  }

  async createProducto(producto: Producto) {
    const { data, error } = await this.db
      .from('productos').insert(producto).select().single();
    if (error) throw error;
    return data;
  }

  async updateProducto(id: string, producto: Partial<Producto>) {
    const { data, error } = await this.db
      .from('productos').update(producto).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async getKardex(productoId: string) {
    const { data, error } = await this.db
      .from('kardex').select('*')
      .eq('producto_id', productoId)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async registrarMovimiento(mov: MovimientoKardex) {
    const { data: prod } = await this.db
      .from('productos').select('stock_actual')
      .eq('id', mov.producto_id).single();

    const stockAnterior  = prod?.stock_actual || 0;
    const esEntrada      = ['entrada_compra','ajuste_entrada','devolucion_venta'].includes(mov.tipo_movimiento);
    const stockPosterior = esEntrada ? stockAnterior + mov.cantidad : stockAnterior - mov.cantidad;

    if (!esEntrada && stockPosterior < 0) {
      throw new Error(`Stock insuficiente. Stock actual: ${stockAnterior}`);
    }

    const { data, error } = await this.db
      .from('kardex')
      .insert({
        ...mov,
        costo_total: mov.cantidad * mov.costo_unitario,
        stock_anterior: stockAnterior,
        stock_posterior: stockPosterior,
      })
      .select().single();
    if (error) throw error;
    return data;
  }

  async getProductosBajoStock(empresaId: string) {
    const { data, error } = await this.db
      .from('productos').select('*')
      .eq('empresa_id', empresaId).eq('controla_stock', true)
      .filter('stock_actual', 'lte', 'stock_minimo');
    if (error) throw error;
    return data || [];
  }
}

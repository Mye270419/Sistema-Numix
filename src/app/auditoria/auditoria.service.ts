import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../configuracion/services/supabase.service';

export interface FiltrosAuditoria {
  tabla?: string;
  operacion?: string;
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private supabaseService = inject(SupabaseService);
  private get db() { return this.supabaseService.client; }

  async getLogs(empresaId: string, filtros: FiltrosAuditoria = {}, pagina = 0, porPagina = 50) {
    let query = this.db
      .from('audit_logs')
      .select('*, usuarios(nombre_completo, email)', { count: 'exact' })
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .range(pagina * porPagina, (pagina + 1) * porPagina - 1);

    if (filtros.tabla)      query = query.eq('tabla_afectada', filtros.tabla);
    if (filtros.operacion)  query = query.eq('operacion', filtros.operacion);
    if (filtros.usuarioId)  query = query.eq('usuario_id', filtros.usuarioId);
    if (filtros.fechaDesde) query = query.gte('created_at', filtros.fechaDesde);
    if (filtros.fechaHasta) query = query.lte('created_at', filtros.fechaHasta + 'T23:59:59');

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  }

  async getResumenActividad(empresaId: string) {
    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);

    const { data, error } = await this.db
      .from('audit_logs')
      .select('operacion, tabla_afectada, created_at')
      .eq('empresa_id', empresaId)
      .gte('created_at', hace7dias.toISOString());
    if (error) throw error;

    const resumen: Record<string, number> = {};
    (data || []).forEach(log => {
      const key = log.tabla_afectada || 'sistema';
      resumen[key] = (resumen[key] || 0) + 1;
    });
    return resumen;
  }

  async getUltimosAccesos(empresaId: string) {
    const { data, error } = await this.db
      .from('audit_logs')
      .select('*, usuarios(nombre_completo)')
      .eq('empresa_id', empresaId)
      .eq('operacion', 'LOGIN')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data || [];
  }

  async registrarAcceso(empresaId: string, usuarioId: string, operacion: 'LOGIN'|'LOGOUT', ip?: string) {
    await this.db.from('audit_logs').insert({
      empresa_id: empresaId,
      usuario_id: usuarioId,
      operacion,
      ip_address: ip,
      descripcion: `${operacion} del usuario`,
    });
  }

  getTablasDisponibles(): string[] {
    return ['asientos_contables','facturas','planillas','empleados','productos','activos_fijos','clientes'];
  }

  getOperaciones(): string[] {
    return ['INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT'];
  }
}

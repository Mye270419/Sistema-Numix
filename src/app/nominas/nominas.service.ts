import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../configuracion/services/supabase.service';

export interface Empleado {
  id?: string;
  empresa_id: string;
  ci: string;
  nombre_completo: string;
  cargo?: string;
  departamento?: string;
  fecha_ingreso: string;
  fecha_salida?: string;
  salario_base: number;
  estado: 'activo' | 'suspendido' | 'baja';
  afp?: string;
  numero_afp?: string;
  caja_salud?: string;
  numero_caja?: string;
  banco?: string;
  numero_cuenta_banco?: string;
  email?: string;
  telefono?: string;
}

export interface DetallePlanilla {
  empleado_id: string;
  dias_trabajados: number;
  salario_base: number;
  horas_extra: number;
  bono_produccion: number;
  otros_haberes: number;
  total_ganado: number;
  afp_laboral: number;
  caja_salud_laboral: number;
  pro_vivienda_laboral: number;
  rc_iva: number;
  otros_descuentos: number;
  total_descuentos: number;
  liquido_pagable: number;
  afp_patronal: number;
  caja_salud_patronal: number;
  pro_vivienda_patronal: number;
  riesgo_laboral_patronal: number;
  total_aporte_patronal: number;
}

// Tasas AFP Bolivia 2024
const TASAS = {
  AFP_LABORAL:          0.1171,
  AFP_PATRONAL:         0.03,
  CAJA_LABORAL:         0.10,
  CAJA_PATRONAL:        0.10,
  PRO_VIVIENDA_LABORAL: 0.02,
  PRO_VIVIENDA_PATRONAL:0.02,
  RIESGO_LABORAL:       0.0171,
  RC_IVA_ALICUOTA:      0.13,
  SMNG:                 2500,
};

@Injectable({ providedIn: 'root' })
export class NominasService {
  private supabaseService = inject(SupabaseService);
  private get db() { return this.supabaseService.client; }

  async getEmpleados(empresaId: string) {
    const { data, error } = await this.db
      .from('empleados').select('*')
      .eq('empresa_id', empresaId).order('nombre_completo');
    if (error) throw error;
    return data;
  }

  async createEmpleado(empleado: Empleado) {
    const { data, error } = await this.db
      .from('empleados').insert(empleado).select().single();
    if (error) throw error;
    return data;
  }

  async updateEmpleado(id: string, empleado: Partial<Empleado>) {
    const { data, error } = await this.db
      .from('empleados').update(empleado).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  calcularDetalle(
    empleado: Empleado,
    diasTrabajados = 30,
    horasExtra = 0,
    bonoProduccion = 0,
    otrosHaberes = 0
  ): DetallePlanilla {
    const salarioProporcional = (empleado.salario_base / 30) * diasTrabajados;
    const totalGanado = salarioProporcional + horasExtra + bonoProduccion + otrosHaberes;

    const afpLaboral         = totalGanado * TASAS.AFP_LABORAL;
    const cajaLaboral        = totalGanado * TASAS.CAJA_LABORAL;
    const proViviendaLaboral = totalGanado * TASAS.PRO_VIVIENDA_LABORAL;
    const baseRcIva          = Math.max(0, totalGanado - 2 * TASAS.SMNG);
    const rcIva              = baseRcIva * TASAS.RC_IVA_ALICUOTA;
    const totalDescuentos    = afpLaboral + cajaLaboral + proViviendaLaboral + rcIva;
    const liquidoPagable     = totalGanado - totalDescuentos;

    const afpPatronal          = totalGanado * TASAS.AFP_PATRONAL;
    const cajaPatronal         = totalGanado * TASAS.CAJA_PATRONAL;
    const proViviendaPatronal  = totalGanado * TASAS.PRO_VIVIENDA_PATRONAL;
    const riesgoLaboral        = totalGanado * TASAS.RIESGO_LABORAL;
    const totalAportePatronal  = afpPatronal + cajaPatronal + proViviendaPatronal + riesgoLaboral;

    return {
      empleado_id: empleado.id!,
      dias_trabajados: diasTrabajados,
      salario_base: salarioProporcional,
      horas_extra: horasExtra,
      bono_produccion: bonoProduccion,
      otros_haberes: otrosHaberes,
      total_ganado: totalGanado,
      afp_laboral: afpLaboral,
      caja_salud_laboral: cajaLaboral,
      pro_vivienda_laboral: proViviendaLaboral,
      rc_iva: rcIva,
      otros_descuentos: 0,
      total_descuentos: totalDescuentos,
      liquido_pagable: liquidoPagable,
      afp_patronal: afpPatronal,
      caja_salud_patronal: cajaPatronal,
      pro_vivienda_patronal: proViviendaPatronal,
      riesgo_laboral_patronal: riesgoLaboral,
      total_aporte_patronal: totalAportePatronal,
    };
  }

  async getPlanillas(empresaId: string) {
    const { data, error } = await this.db
      .from('planillas')
      .select('*, periodos_contables(mes, anio)')
      .eq('empresa_id', empresaId)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false });
    if (error) throw error;
    return data;
  }

  async crearPlanilla(
    empresaId: string, periodoId: string,
    mes: number, anio: number,
    creadoPor: string, detalles: DetallePlanilla[]
  ) {
    const totales = detalles.reduce((acc, d) => ({
      haberes:    acc.haberes    + d.total_ganado,
      descuentos: acc.descuentos + d.total_descuentos,
      liquido:    acc.liquido    + d.liquido_pagable,
      patronal:   acc.patronal   + d.total_aporte_patronal,
    }), { haberes: 0, descuentos: 0, liquido: 0, patronal: 0 });

    const { data: planilla, error } = await this.db
      .from('planillas')
      .insert({
        empresa_id: empresaId, periodo_id: periodoId, mes, anio,
        estado: 'calculada',
        total_haberes: totales.haberes,
        total_descuentos: totales.descuentos,
        total_liquido: totales.liquido,
        total_aporte_patronal: totales.patronal,
        creado_por: creadoPor,
      })
      .select().single();
    if (error) throw error;

    const { error: errDetalle } = await this.db
      .from('detalle_planillas')
      .insert(detalles.map(d => ({ ...d, planilla_id: planilla.id })));
    if (errDetalle) throw errDetalle;

    return planilla;
  }

  async getDetallePlanilla(planillaId: string) {
    const { data, error } = await this.db
      .from('detalle_planillas')
      .select('*, empleados(nombre_completo, cargo, ci)')
      .eq('planilla_id', planillaId);
    if (error) throw error;
    return data;
  }
}

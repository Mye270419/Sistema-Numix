import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivosFijosService, ActivoFijo, TASAS_DEPRECIACION } from './activos-fijos.service';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-activos-fijos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activos-fijos.html',
  styleUrls: ['./activos-fijos.css']
})
export class ActivosFijosComponent implements OnInit {

  tabActivo: 'listado' | 'nuevo' | 'depreciacion' = 'listado';
  activos: ActivoFijo[] = [];
  activoSeleccionado: ActivoFijo | null = null;
  depreciaciones: any[] = [];
  guardando = false;
  calculando = false;
  mostrarModal = false;

  empresaId = localStorage.getItem('empresa_id') || '';

  categorias = [
    { value: 'inmueble',           label: 'Inmueble',              tasa: 2.5  },
    { value: 'maquinaria',         label: 'Maquinaria',            tasa: 12.5 },
    { value: 'vehiculo',           label: 'Vehículo',              tasa: 20   },
    { value: 'muebles_enseres',    label: 'Muebles y Enseres',     tasa: 10   },
    { value: 'equipo_computo',     label: 'Equipo de Cómputo',     tasa: 25   },
    { value: 'equipo_comunicacion',label: 'Equipo de Comunicación',tasa: 25   },
    { value: 'otro',               label: 'Otro',                  tasa: 10   },
  ];

  activoForm: Partial<ActivoFijo> = this.formVacio();

  // Para depreciación
  ufvInicio = 1;
  ufvFin    = 1;
  calculoDepreciacion: any = null;

  // Totales resumen
  get totalCostoHistorico()  { return this.activos.reduce((s, a) => s + a.costo_historico, 0); }
  get totalValorLibros()     { return this.activos.reduce((s, a) => s + (a.valor_libros_actual || 0), 0); }
  get totalDepreciacionAcum(){ return this.activos.reduce((s, a) => s + (a.depreciacion_acumulada || 0), 0); }

 constructor(
  private router: Router,  // ← ✅ AGREGAR ESTE PARÁMETRO PRIMERO
  private activosService: ActivosFijosService
) {}

  ngOnInit() { this.cargarActivos(); }

  async cargarActivos() {
  console.log('🔍 [DEBUG] Cargando activos para empresa_id:', this.empresaId);
  
  try {
    const data = await this.activosService.getActivos(this.empresaId);
    
    console.log('✅ [DEBUG] Datos recibidos:', {
      cantidad: data?.length,
      primerRegistro: data?.[0],
      raw: data
    });
    
    this.activos = data;
  } catch (err: any) {
  console.error('❌ [DEBUG] Error COMPLETO en cargarActivos:', {
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
    code: err?.code,
    fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
  });
}
}

  formVacio(): Partial<ActivoFijo> {
    return {
      codigo: '', descripcion: '', categoria: 'equipo_computo',
      fecha_adquisicion: '', costo_historico: 0, valor_residual: 0,
      vida_util_anios: 4, metodo_depreciacion: 'linea_recta',
      ubicacion: '', numero_serie: '', proveedor: '', activo: true,
    };
  }

  get tasaActualForm(): number {
    return TASAS_DEPRECIACION[this.activoForm.categoria || 'otro'] || 10;
  }

  async guardarActivo() {
    this.guardando = true;
    try {
      await this.activosService.createActivo({
        ...this.activoForm as ActivoFijo,
        empresa_id: this.empresaId,
      });
      this.activoForm = this.formVacio();
      this.tabActivo = 'listado';
      await this.cargarActivos();
      alert('✅ Activo registrado correctamente');
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally { this.guardando = false; }
  }

  async seleccionarActivo(activo: ActivoFijo) {
    this.activoSeleccionado = activo;
    this.depreciaciones = await this.activosService.getDepreciaciones(activo.id!);
    this.mostrarModal = true;
  }

  calcularPreview() {
    if (!this.activoSeleccionado) return;
    this.calculoDepreciacion = this.activosService.calcularDepreciacionMensual(
      this.activoSeleccionado, this.ufvInicio, this.ufvFin
    );
  }

  async registrarDepreciacion() {
    if (!this.activoSeleccionado || !this.calculoDepreciacion) return;
    this.guardando = true;
    try {
      const periodoId = ''; // TODO: obtener período activo
      await this.activosService.registrarDepreciacion(
        this.activoSeleccionado.id!,
        periodoId,
        new Date().toISOString().split('T')[0],
        this.calculoDepreciacion
      );
      this.calculoDepreciacion = null;
      await this.cargarActivos();
      alert('✅ Depreciación registrada');
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally { this.guardando = false; }
  }

  cerrarModal(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.mostrarModal = false;
    }
  }

  getLabelCategoria(cat: string): string {
    return this.categorias.find(c => c.value === cat)?.label || cat;
  }

  getPorcentajeDepreciado(activo: ActivoFijo): number {
    if (!activo.costo_historico) return 0;
    return Math.round(((activo.depreciacion_acumulada || 0) / activo.costo_historico) * 100);
  }
  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}

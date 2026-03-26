import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NominasService, Empleado, DetallePlanilla } from './nominas.service';
import { ExportService } from '../export/export.service';
import { AuthService } from '../auth';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-nominas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nominas.html',
  styleUrls: ['./nominas.css']
})
export class NominasComponent implements OnInit {

  tabActivo: 'planillas' | 'empleados' | 'nueva' = 'planillas';
  busqueda = '';
  calculando = false;
  guardando = false;
  mostrarModalEmpleado = false;

  empleados: Empleado[] = [];
  planillas: any[] = [];
  detallesCalculados: DetallePlanilla[] = [];
  empleadoEditando: Empleado | null = null;

  meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
           'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  anioActual = new Date().getFullYear();
  nuevaPlanilla = { mes: new Date().getMonth() + 1, anio: this.anioActual };

  empleadoForm: Partial<Empleado> = {
    ci: '', nombre_completo: '', cargo: '', departamento: '',
    fecha_ingreso: '', salario_base: 0, afp: '', numero_afp: '',
    caja_salud: '', email: '', telefono: '', estado: 'activo'
  };

  empresaId = localStorage.getItem('empresa_id') || '';
  

  private get empresaInfo() {
    return {
      nombre: this.authService.currentUserValue?.empresa || 'NUMIX',
      nit: '123456789',
    };
  }

  constructor(
    private router: Router, 
    private nominasService: NominasService,
    private exportService: ExportService,
    private authService: AuthService,
  ) {}

  ngOnInit() { this.cargarDatos(); }

  async cargarDatos() {
    try {
      this.empleados = await this.nominasService.getEmpleados(this.empresaId);
      this.planillas = await this.nominasService.getPlanillas(this.empresaId);
    } catch (err) { console.error('Error cargando datos:', err); }
  }

  get empleadosFiltrados() {
    const q = this.busqueda.toLowerCase();
    return this.empleados.filter(e =>
      e.nombre_completo.toLowerCase().includes(q) ||
      e.ci.includes(q) ||
      (e.cargo || '').toLowerCase().includes(q)
    );
  }

  get totalGanado()    { return this.detallesCalculados.reduce((s, d) => s + d.total_ganado, 0); }
  get totalDescuentos(){ return this.detallesCalculados.reduce((s, d) => s + d.total_descuentos, 0); }
  get totalLiquido()   { return this.detallesCalculados.reduce((s, d) => s + d.liquido_pagable, 0); }
  get totalPatronal()  { return this.detallesCalculados.reduce((s, d) => s + d.total_aporte_patronal, 0); }

  async calcularPlanilla() {
    this.calculando = true;
    const activos = this.empleados.filter(e => e.estado === 'activo');
    this.detallesCalculados = activos.map(e => this.nominasService.calcularDetalle(e));
    this.calculando = false;
  }

  recalcularFila(index: number) {
    const empleado = this.empleados.filter(e => e.estado === 'activo')[index];
    const d = this.detallesCalculados[index];
    this.detallesCalculados[index] = this.nominasService.calcularDetalle(
      empleado, d.dias_trabajados, d.horas_extra, d.bono_produccion, d.otros_haberes
    );
  }

  async guardarPlanilla() {
    this.guardando = true;
    try {
      const usuarioId = localStorage.getItem('usuario_id') || '';
      const periodoId = '';
      await this.nominasService.crearPlanilla(
        this.empresaId, periodoId,
        this.nuevaPlanilla.mes, this.nuevaPlanilla.anio,
        usuarioId, this.detallesCalculados
      );
      this.detallesCalculados = [];
      this.tabActivo = 'planillas';
      await this.cargarDatos();
      alert('✅ Planilla guardada correctamente');
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally { this.guardando = false; }
  }

  abrirModalEmpleado() {
    this.empleadoEditando = null;
    this.empleadoForm = {
      ci: '', nombre_completo: '', cargo: '', departamento: '',
      fecha_ingreso: '', salario_base: 0, afp: '', caja_salud: '',
      email: '', telefono: '', estado: 'activo', empresa_id: this.empresaId
    };
    this.mostrarModalEmpleado = true;
  }

  editarEmpleado(empleado: Empleado) {
    this.empleadoEditando = empleado;
    this.empleadoForm = { ...empleado };
    this.mostrarModalEmpleado = true;
  }

  verEmpleado(empleado: Empleado) {}

  async guardarEmpleado() {
    this.guardando = true;
    try {
      if (this.empleadoEditando?.id) {
        await this.nominasService.updateEmpleado(this.empleadoEditando.id, this.empleadoForm);
      } else {
        await this.nominasService.createEmpleado({
          ...this.empleadoForm as Empleado,
          empresa_id: this.empresaId
        });
      }
      this.mostrarModalEmpleado = false;
      await this.cargarDatos();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally { this.guardando = false; }
  }

  async verDetallePlanilla(planilla: any) {}

  cerrarModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.mostrarModalEmpleado = false;
    }
  }

  getNombreMes(mes: number): string { return this.meses[mes - 1] || ''; }

  // ── Datos para exportar la planilla activa (calculada o seleccionada) ──
  private getDatosExport() {
    // Si hay una planilla calculada en pantalla, exportarla
    // Si no, usar los empleados actuales calculados
    const fuente = this.detallesCalculados.length > 0
      ? this.detallesCalculados
      : [];

    const empleadosActivos = this.empleados.filter(e => e.estado === 'activo');

    return {
      empresa:  this.empresaInfo,
      mes:      this.getNombreMes(this.nuevaPlanilla.mes),
      anio:     this.nuevaPlanilla.anio,
      empleados: fuente.map((d, i) => ({
        ci:               empleadosActivos[i]?.ci              || '',
        nombre:           empleadosActivos[i]?.nombre_completo || '',
        cargo:            empleadosActivos[i]?.cargo           || '',
        totalGanado:      d.total_ganado,
        afpLaboral:       d.afp_laboral,
        cajaLaboral:      d.caja_salud_laboral,
        rcIva:            d.rc_iva,
        totalDescuentos:  d.total_descuentos,
        liquidoPagable:   d.liquido_pagable,
        totalPatronal:    d.total_aporte_patronal,
      })),
      totales: {
        ganado:     this.totalGanado,
        descuentos: this.totalDescuentos,
        liquido:    this.totalLiquido,
        patronal:   this.totalPatronal,
      },
    };
  }

  exportarPDF(): void {
    if (this.detallesCalculados.length === 0) {
      alert('⚠️ Primero calcula una planilla para exportar.');
      return;
    }
    this.exportService.exportPlanillaPDF(this.getDatosExport());
  }

  exportarExcel(): void {
    if (this.detallesCalculados.length === 0) {
      alert('⚠️ Primero calcula una planilla para exportar.');
      return;
    }
    this.exportService.exportPlanillaExcel(this.getDatosExport());
  }
   volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}

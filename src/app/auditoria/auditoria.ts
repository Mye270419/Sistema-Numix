import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService, FiltrosAuditoria } from './auditoria.service';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.html',
  styleUrls: ['./auditoria.css']
})
export class AuditoriaComponent implements OnInit {

  logs: any[] = [];
  totalLogs = 0;
  paginaActual = 0;
  porPagina = 50;
  cargando = false;
  resumenActividad: Record<string, number> = {};
  ultimosAccesos: any[] = [];

  filtros: FiltrosAuditoria = {
    tabla: '', operacion: '', usuarioId: '',
    fechaDesde: '', fechaHasta: ''
  };

  empresaId = localStorage.getItem('empresa_id') || '';

  tablasDisponibles: string[] = [];
  operacionesDisponibles: string[] = [];

  get totalPaginas() { return Math.ceil(this.totalLogs / this.porPagina); }
  
  constructor(
    private router: Router,
    private auditoriaService: AuditoriaService
  ){}


  ngOnInit() {
    this.tablasDisponibles  = this.auditoriaService.getTablasDisponibles();
    this.operacionesDisponibles = this.auditoriaService.getOperaciones();
    this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const [resultado, resumen, accesos] = await Promise.all([
        this.auditoriaService.getLogs(this.empresaId, this.filtros, this.paginaActual, this.porPagina),
        this.auditoriaService.getResumenActividad(this.empresaId),
        this.auditoriaService.getUltimosAccesos(this.empresaId),
      ]);
      this.logs = resultado.data;
      this.totalLogs = resultado.total;
      this.resumenActividad = resumen;
      this.ultimosAccesos = accesos;
    } catch (err) {
      console.error(err);
    } finally {
      this.cargando = false;
    }
  }

  aplicarFiltros() {
    this.paginaActual = 0;
    this.cargarDatos();
  }

  limpiarFiltros() {
    this.filtros = { tabla: '', operacion: '', usuarioId: '', fechaDesde: '', fechaHasta: '' };
    this.paginaActual = 0;
    this.cargarDatos();
  }

  cambiarPagina(delta: number) {
    const nueva = this.paginaActual + delta;
    if (nueva >= 0 && nueva < this.totalPaginas) {
      this.paginaActual = nueva;
      this.cargarDatos();
    }
  }

  getColorOperacion(op: string): string {
    const colores: Record<string, string> = {
      INSERT: 'badge-green',
      UPDATE: 'badge-amber',
      DELETE: 'badge-red',
      LOGIN:  'badge-blue',
      LOGOUT: 'badge-gray',
      EXPORT: 'badge-purple',
    };
    return colores[op] || 'badge-gray';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  get resumenArray() {
    return Object.entries(this.resumenActividad)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }

  verDiferencias(log: any) {
    if (!log.datos_anteriores && !log.datos_nuevos) {
      alert('No hay datos de diferencia registrados.');
      return;
    }
    const anterior = JSON.stringify(log.datos_anteriores, null, 2);
    const nuevo    = JSON.stringify(log.datos_nuevos, null, 2);
    alert(`ANTES:\n${anterior}\n\nDESPUÉS:\n${nuevo}`);
  }
  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}

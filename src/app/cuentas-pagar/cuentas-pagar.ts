import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';

// Declarar anime.js
declare var anime: any;

interface Tercero {
  id: number;
  tipo: 'CLIENTE' | 'PROVEEDOR';
  nit: string;
  razonSocial: string;
  email: string;
  telefono: string;
  direccion: string;
  activo: boolean;
  fechaRegistro: string;
}

interface DocumentoPorPagar {
  id: number;
  tipoDocumento: 'FACTURA' | 'NOTA_CREDITO' | 'PRESTAMO' | 'SERVICIO';
  numeroDocumento: string;
  proveedor: Tercero;
  fechaEmision: string;
  fechaVencimiento: string;
  montoOriginal: number;
  montoSaldo: number;
  montoPagado: number;
  estado: 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO' | 'VENCIDO';
  diasVencimiento: number;
  observaciones: string;
}

interface PagoPagar {
  id: number;
  documentoId: number;
  fechaPago: string;
  montoPago: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA';
  numeroCheque?: string;
  banco?: string;
  observaciones: string;
  registradoPor: string;
}

@Component({
  selector: 'app-cuentas-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas-pagar.html',
  styleUrls: ['./cuentas-pagar.css']
})
export class CuentasPagarComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef ;
  Math = Math;

  // Estado de la vista
  vistaActual: 'documentos' | 'pagos' | 'proveedores' | 'nuevo-pago' = 'documentos';

  // Proveedores
  proveedores: Tercero[] = [
    {
      id: 1, tipo: 'PROVEEDOR', nit: '7777777777', razonSocial: 'Papelería Comercial La Paz',
      email: 'ventas@papeleria.bo', telefono: '2-2345678', direccion: 'Av. Buenos Aires #456, La Paz',
      activo: true, fechaRegistro: '2024-01-10'
    },
    {
      id: 2, tipo: 'PROVEEDOR', nit: '8888888888', razonSocial: 'Servicios Informáticos TechBo',
      email: 'soporte@techbo.bo', telefono: '3-3456789', direccion: 'Calle 21 de Calacoto #789, La Paz',
      activo: true, fechaRegistro: '2024-02-05'
    },
    {
      id: 3, tipo: 'PROVEEDOR', nit: '9999999999', razonSocial: 'Consultora Legal Andina',
      email: 'contacto@legal-andina.bo', telefono: '4-4567890', direccion: 'Plaza Murillo #123, La Paz',
      activo: true, fechaRegistro: '2024-03-01'
    },
    {
      id: 4, tipo: 'PROVEEDOR', nit: '1111111111', razonSocial: 'Empresa de Limpieza CleanBo',
      email: 'servicios@cleanbo.com', telefono: '2-7894561', direccion: 'Zona Sur #321, La Paz',
      activo: true, fechaRegistro: '2024-01-25'
    }
  ];

  // Documentos por pagar
  documentosPorPagar: DocumentoPorPagar[] = [
    {
      id: 1, tipoDocumento: 'FACTURA', numeroDocumento: 'PAP-001', proveedor: this.proveedores[0],
      fechaEmision: '2024-09-01', fechaVencimiento: '2024-09-30', montoOriginal: 1200.00,
      montoPagado: 0, montoSaldo: 1200.00, estado: 'PENDIENTE', diasVencimiento: -4,
      observaciones: 'Material de oficina - Papelería y suministros mensuales'
    },
    {
      id: 2, tipoDocumento: 'SERVICIO', numeroDocumento: 'TECH-002', proveedor: this.proveedores[1],
      fechaEmision: '2024-08-15', fechaVencimiento: '2024-09-15', montoOriginal: 3500.00,
      montoPagado: 1500.00, montoSaldo: 2000.00, estado: 'PAGADO_PARCIAL', diasVencimiento: 10,
      observaciones: 'Mantenimiento sistemas informáticos - Pago parcial realizado'
    },
    {
      id: 3, tipoDocumento: 'FACTURA', numeroDocumento: 'LEG-003', proveedor: this.proveedores[2],
      fechaEmision: '2024-09-10', fechaVencimiento: '2024-10-10', montoOriginal: 2800.00,
      montoPagado: 0, montoSaldo: 2800.00, estado: 'PENDIENTE', diasVencimiento: -15,
      observaciones: 'Asesoría legal - Revisión de contratos empresariales'
    },
    {
      id: 4, tipoDocumento: 'SERVICIO', numeroDocumento: 'CLEAN-004', proveedor: this.proveedores[3],
      fechaEmision: '2024-08-01', fechaVencimiento: '2024-08-31', montoOriginal: 850.00,
      montoPagado: 850.00, montoSaldo: 0, estado: 'PAGADO', diasVencimiento: 25,
      observaciones: 'Servicios de limpieza - Pagado en fecha'
    },
    {
      id: 5, tipoDocumento: 'FACTURA', numeroDocumento: 'PAP-005', proveedor: this.proveedores[0],
      fechaEmision: '2024-07-20', fechaVencimiento: '2024-08-20', montoOriginal: 950.00,
      montoPagado: 0, montoSaldo: 950.00, estado: 'VENCIDO', diasVencimiento: 35,
      observaciones: 'Material de oficina adicional - VENCIDA - Requiere pago urgente'
    }
  ];

  // Pagos registrados
  pagos: PagoPagar[] = [
    {
      id: 1, documentoId: 2, fechaPago: '2024-09-10', montoPago: 1500.00,
      metodoPago: 'TRANSFERENCIA', banco: 'Banco Mercantil Santa Cruz',
      observaciones: 'Pago parcial por mantenimiento informático', registradoPor: 'Admin'
    },
    {
      id: 2, documentoId: 4, fechaPago: '2024-08-30', montoPago: 850.00,
      metodoPago: 'EFECTIVO', observaciones: 'Pago completo servicios de limpieza', registradoPor: 'Admin'
    }
  ];

  // Nuevo pago
  nuevoPago: PagoPagar = this.inicializarNuevoPago();
  documentoSeleccionado: DocumentoPorPagar | null = null;

  // Nuevo proveedor
  nuevoProveedor: Tercero = this.inicializarNuevoProveedor();

  // Filtros
  filtroEstado = '';
  filtroProveedor = '';
  documentosFiltrados: DocumentoPorPagar[] = [];

  // Métricas
  metricas = {
    totalPorPagar: 0,
    totalVencido: 0,
    totalPendiente: 0,
    proveedoresConDeuda: 0
  };

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.calcularDiasVencimiento();
    this.actualizarEstados();
    this.aplicarFiltros();
    this.calcularMetricas();
    
    console.log('💳 Módulo Cuentas por Pagar iniciado');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startModuleAnimation();
    }, 300);
  }

  startModuleAnimation(): void {
    console.log('🎨 Animando módulo Cuentas por Pagar...');

    anime({
      targets: this.container.nativeElement,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      easing: 'easeOutCubic'
    });

    // Animar métricas
    anime({
      targets: '.metric-card',
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 600,
      delay: anime.stagger(100, {start: 400}),
      easing: 'easeOutBack'
    });

    // Animar documentos
    anime({
      targets: '.documento-card',
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 500,
      delay: anime.stagger(100, {start: 600}),
      easing: 'easeOutCubic'
    });
  }

  // Navegación
  cambiarVista(vista: 'documentos' | 'pagos' | 'proveedores' | 'nuevo-pago'): void {
    this.vistaActual = vista;
    
    anime({
      targets: '.content-area',
      opacity: [1, 0],
      duration: 200,
      complete: () => {
        anime({
          targets: '.content-area',
          opacity: [0, 1],
          duration: 300,
          easing: 'easeOutCubic'
        });
      }
    });
  }

  // Cálculos y actualizaciones
  calcularDiasVencimiento(): void {
    const hoy = new Date();
    this.documentosPorPagar.forEach(doc => {
      const fechaVenc = new Date(doc.fechaVencimiento);
      const diffTime = hoy.getTime() - fechaVenc.getTime();
      doc.diasVencimiento = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });
  }

  actualizarEstados(): void {
    this.documentosPorPagar.forEach(doc => {
      if (doc.montoSaldo === 0) {
        doc.estado = 'PAGADO';
      } else if (doc.montoPagado > 0 && doc.montoSaldo > 0) {
        doc.estado = 'PAGADO_PARCIAL';
      } else if (doc.diasVencimiento > 0) {
        doc.estado = 'VENCIDO';
      } else {
        doc.estado = 'PENDIENTE';
      }
    });
  }

  aplicarFiltros(): void {
    let documentos = [...this.documentosPorPagar];
    
    if (this.filtroEstado) {
      documentos = documentos.filter(doc => doc.estado === this.filtroEstado);
    }
    
    if (this.filtroProveedor) {
      documentos = documentos.filter(doc => 
        doc.proveedor.razonSocial.toLowerCase().includes(this.filtroProveedor.toLowerCase()) ||
        doc.proveedor.nit.includes(this.filtroProveedor)
      );
    }
    
    this.documentosFiltrados = documentos;
  }

  calcularMetricas(): void {
    this.metricas.totalPorPagar = this.documentosPorPagar
      .reduce((total, doc) => total + doc.montoSaldo, 0);
    
    this.metricas.totalVencido = this.documentosPorPagar
      .filter(doc => doc.estado === 'VENCIDO')
      .reduce((total, doc) => total + doc.montoSaldo, 0);
    
    this.metricas.totalPendiente = this.documentosPorPagar
      .filter(doc => doc.estado === 'PENDIENTE')
      .reduce((total, doc) => total + doc.montoSaldo, 0);
    
    const proveedoresConDeuda = new Set(
      this.documentosPorPagar
        .filter(doc => doc.montoSaldo > 0)
        .map(doc => doc.proveedor.id)
    );
    this.metricas.proveedoresConDeuda = proveedoresConDeuda.size;
  }

  // Gestión de pagos
  inicializarNuevoPago(): PagoPagar {
    return {
      id: 0,
      documentoId: 0,
      fechaPago: new Date().toISOString().split('T')[0],
      montoPago: 0,
      metodoPago: 'EFECTIVO',
      observaciones: '',
      registradoPor: this.authService.currentUserValue?.fullName || 'Usuario'
    };
  }

  seleccionarDocumento(documento: DocumentoPorPagar): void {
    this.documentoSeleccionado = documento;
    this.nuevoPago.documentoId = documento.id;
    this.nuevoPago.montoPago = documento.montoSaldo;
    this.vistaActual = 'nuevo-pago';
  }

  async registrarPago(): Promise<void> {
    if (!this.validarPago()) return;

    const documento = this.documentosPorPagar.find(d => d.id === this.nuevoPago.documentoId);
    if (!documento) return;

    // Registrar pago
    this.nuevoPago.id = Date.now();
    this.pagos.push({...this.nuevoPago});

    // Actualizar documento
    documento.montoPagado += this.nuevoPago.montoPago;
    documento.montoSaldo -= this.nuevoPago.montoPago;

    // Recalcular estados y métricas
    this.actualizarEstados();
    this.calcularMetricas();
    this.aplicarFiltros();

    console.log('💳 Pago registrado:', this.nuevoPago);
    this.mostrarExito(`Pago de ${this.formatCurrency(this.nuevoPago.montoPago)} registrado correctamente`);

    // Limpiar formulario
    this.nuevoPago = this.inicializarNuevoPago();
    this.documentoSeleccionado = null;
    this.vistaActual = 'documentos';

    // Animación de éxito
    anime({
      targets: '.documento-card',
      scale: [1, 1.02, 1],
      duration: 400,
      easing: 'easeInOutCubic'
    });
  }

  validarPago(): boolean {
    if (this.nuevoPago.montoPago <= 0) {
      this.mostrarError('El monto del pago debe ser mayor a cero');
      return false;
    }

    const documento = this.documentosPorPagar.find(d => d.id === this.nuevoPago.documentoId);
    if (!documento) {
      this.mostrarError('Documento no encontrado');
      return false;
    }

    if (this.nuevoPago.montoPago > documento.montoSaldo) {
      this.mostrarError('El monto del pago no puede ser mayor al saldo pendiente');
      return false;
    }

    return true;
  }

  // Gestión de proveedores
  inicializarNuevoProveedor(): Tercero {
    return {
      id: 0,
      tipo: 'PROVEEDOR',
      nit: '',
      razonSocial: '',
      email: '',
      telefono: '',
      direccion: '',
      activo: true,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };
  }

  agregarProveedor(): void {
    if (!this.nuevoProveedor.nit || !this.nuevoProveedor.razonSocial) {
      this.mostrarError('NIT y Razón Social son obligatorios');
      return;
    }

    this.nuevoProveedor.id = Date.now();
    this.proveedores.push({...this.nuevoProveedor});
    
    this.mostrarExito('Proveedor agregado correctamente');
    this.nuevoProveedor = this.inicializarNuevoProveedor();

    anime({
      targets: '.proveedor-card:last-child',
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 400,
      easing: 'easeOutBack'
    });
  }

  // Métodos auxiliares para el template
  getSaldoPorProveedor(proveedorId: number): number {
    return this.documentosPorPagar
      .filter(d => d.proveedor.id === proveedorId)
      .reduce((total, d) => total + d.montoSaldo, 0);
  }

  getDocumentoPorId(documentoId: number): DocumentoPorPagar | undefined {
    return this.documentosPorPagar.find(d => d.id === documentoId);
  }

  getNumeroDocumento(documentoId: number): string {
    const documento = this.getDocumentoPorId(documentoId);
    return documento?.numeroDocumento || 'N/A';
  }

  getRazonSocialProveedor(documentoId: number): string {
    const documento = this.getDocumentoPorId(documentoId);
    return documento?.proveedor.razonSocial || 'N/A';
  }

  // Utilidades
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge-pending';
      case 'PAGADO_PARCIAL': return 'badge-partial';
      case 'PAGADO': return 'badge-paid';
      case 'VENCIDO': return 'badge-overdue';
      default: return 'badge-default';
    }
  }

  getDiasVencimientoClass(dias: number): string {
    if (dias <= 0) return 'dias-ok';
    if (dias <= 15) return 'dias-warning';
    return 'dias-danger';
  }

  getPagosPorDocumento(documentoId: number): PagoPagar[] {
    return this.pagos.filter(p => p.documentoId === documentoId);
  }

  mostrarError(mensaje: string): void {
    console.error('❌', mensaje);
  }

  mostrarExito(mensaje: string): void {
    console.log('✅', mensaje);
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
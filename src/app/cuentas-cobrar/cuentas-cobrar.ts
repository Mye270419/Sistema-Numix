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

interface DocumentoPorCobrar {
  id: number;
  tipoDocumento: 'FACTURA' | 'NOTA_DEBITO' | 'PRESTAMO';
  numeroDocumento: string;
  cliente: Tercero;
  fechaEmision: string;
  fechaVencimiento: string;
  montoOriginal: number;
  montoSaldo: number;
  montoPagado: number;
  estado: 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO' | 'VENCIDO';
  diasVencimiento: number;
  observaciones: string;
}

interface PagoCobro {
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
  selector: 'app-cuentas-cobrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas-cobrar.html',
  styleUrls: ['./cuentas-cobrar.css']
})
export class CuentasCobrarComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;

  // Estado de la vista
  vistaActual: 'documentos' | 'pagos' | 'clientes' | 'nuevo-pago' = 'documentos';

  // Clientes
  clientes: Tercero[] = [
    {
      id: 1, tipo: 'CLIENTE', nit: '1234567890', razonSocial: 'Empresa Constructora ABC S.R.L.',
      email: 'pagos@abc.com.bo', telefono: '70123456', direccion: 'Av. 6 de Agosto #123, La Paz',
      activo: true, fechaRegistro: '2024-01-15'
    },
    {
      id: 2, tipo: 'CLIENTE', nit: '9876543210', razonSocial: 'Comercial XYZ Ltda.',
      email: 'contabilidad@xyz.bo', telefono: '76654321', direccion: 'Calle Murillo #456, Santa Cruz',
      activo: true, fechaRegistro: '2024-02-20'
    },
    {
      id: 3, tipo: 'CLIENTE', nit: '5555555555', razonSocial: 'Servicios Profesionales 123',
      email: 'info@servicios123.bo', telefono: '72345678', direccion: 'Plaza Principal #789, Cochabamba',
      activo: true, fechaRegistro: '2024-03-10'
    }
  ];

  // Documentos por cobrar
  documentosPorCobrar: DocumentoPorCobrar[] = [
    {
      id: 1, tipoDocumento: 'FACTURA', numeroDocumento: 'FACT-001', cliente: this.clientes[0],
      fechaEmision: '2024-09-01', fechaVencimiento: '2024-10-01', montoOriginal: 5000.00,
      montoPagado: 2000.00, montoSaldo: 3000.00, estado: 'PAGADO_PARCIAL', diasVencimiento: 0,
      observaciones: 'Consultoría contable - Pago parcial recibido'
    },
    {
      id: 2, tipoDocumento: 'FACTURA', numeroDocumento: 'FACT-002', cliente: this.clientes[1],
      fechaEmision: '2024-08-15', fechaVencimiento: '2024-09-15', montoOriginal: 3200.00,
      montoPagado: 0, montoSaldo: 3200.00, estado: 'VENCIDO', diasVencimiento: 10,
      observaciones: 'Auditoría interna - Cliente no ha realizado pago'
    },
    {
      id: 3, tipoDocumento: 'FACTURA', numeroDocumento: 'FACT-003', cliente: this.clientes[2],
      fechaEmision: '2024-09-15', fechaVencimiento: '2024-10-15', montoOriginal: 1500.00,
      montoPagado: 0, montoSaldo: 1500.00, estado: 'PENDIENTE', diasVencimiento: 0,
      observaciones: 'Capacitación en sistema contable'
    },
    {
      id: 4, tipoDocumento: 'FACTURA', numeroDocumento: 'FACT-004', cliente: this.clientes[0],
      fechaEmision: '2024-09-10', fechaVencimiento: '2024-09-25', montoOriginal: 2500.00,
      montoPagado: 2500.00, montoSaldo: 0, estado: 'PAGADO', diasVencimiento: 0,
      observaciones: 'Declaración de impuestos - Pagado en efectivo'
    }
  ];

  // Pagos registrados
  pagos: PagoCobro[] = [
    {
      id: 1, documentoId: 1, fechaPago: '2024-09-10', montoPago: 2000.00,
      metodoPago: 'TRANSFERENCIA', banco: 'Banco Mercantil Santa Cruz',
      observaciones: 'Pago parcial por transferencia bancaria', registradoPor: 'Admin'
    },
    {
      id: 2, documentoId: 4, fechaPago: '2024-09-20', montoPago: 2500.00,
      metodoPago: 'EFECTIVO', observaciones: 'Pago completo en efectivo', registradoPor: 'Admin'
    }
  ];

  // ✅ CORREGIDO: Solo declaración, sin inicialización directa
  nuevoPago!: PagoCobro;
  documentoSeleccionado: DocumentoPorCobrar | null = null;

  // ✅ CORREGIDO: Solo declaración, sin inicialización directa
  nuevoCliente!: Tercero;

  // Filtros
  filtroEstado = '';
  filtroCliente = '';
  documentosFiltrados: DocumentoPorCobrar[] = [];

  // Métricas
  metricas = {
    totalPorCobrar: 0,
    totalVencido: 0,
    totalPendiente: 0,
    clientesConDeuda: 0
  };

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Validar autenticación primero
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    // ✅ CORREGIDO: Inicializar después de que authService esté disponible
    this.nuevoPago = this.inicializarNuevoPago();
    this.nuevoCliente = this.inicializarNuevoCliente();

    this.calcularDiasVencimiento();
    this.actualizarEstados();
    this.aplicarFiltros();
    this.calcularMetricas();
    
    console.log('💰 Módulo Cuentas por Cobrar iniciado');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startModuleAnimation();
    }, 300);
  }

  startModuleAnimation(): void {
    console.log('🎨 Animando módulo Cuentas por Cobrar...');

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
  cambiarVista(vista: 'documentos' | 'pagos' | 'clientes' | 'nuevo-pago'): void {
    this.vistaActual = vista;
    
    // Animación de cambio
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
    this.documentosPorCobrar.forEach(doc => {
      const fechaVenc = new Date(doc.fechaVencimiento);
      const diffTime = hoy.getTime() - fechaVenc.getTime();
      doc.diasVencimiento = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });
  }

  actualizarEstados(): void {
    this.documentosPorCobrar.forEach(doc => {
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
    let documentos = [...this.documentosPorCobrar];
    
    if (this.filtroEstado) {
      documentos = documentos.filter(doc => doc.estado === this.filtroEstado);
    }
    
    if (this.filtroCliente) {
      documentos = documentos.filter(doc => 
        doc.cliente.razonSocial.toLowerCase().includes(this.filtroCliente.toLowerCase()) ||
        doc.cliente.nit.includes(this.filtroCliente)
      );
    }
    
    this.documentosFiltrados = documentos;
  }

  calcularMetricas(): void {
    this.metricas.totalPorCobrar = this.documentosPorCobrar
      .reduce((total, doc) => total + doc.montoSaldo, 0);
    
    this.metricas.totalVencido = this.documentosPorCobrar
      .filter(doc => doc.estado === 'VENCIDO')
      .reduce((total, doc) => total + doc.montoSaldo, 0);
    
    this.metricas.totalPendiente = this.documentosPorCobrar
      .filter(doc => doc.estado === 'PENDIENTE')
      .reduce((total, doc) => total + doc.montoSaldo, 0);
    
    const clientesConDeuda = new Set(
      this.documentosPorCobrar
        .filter(doc => doc.montoSaldo > 0)
        .map(doc => doc.cliente.id)
    );
    this.metricas.clientesConDeuda = clientesConDeuda.size;
  }

  // Gestión de pagos
  inicializarNuevoPago(): PagoCobro {
    return {
      id: 0,
      documentoId: 0,
      fechaPago: new Date().toISOString().split('T')[0],
      montoPago: 0,
      metodoPago: 'EFECTIVO',
      observaciones: '',
      // ✅ CORREGIDO: Encadenamiento opcional más seguro
      registradoPor: this.authService?.currentUserValue?.fullName || 'Usuario'
    };
  }

  seleccionarDocumento(documento: DocumentoPorCobrar): void {
    this.documentoSeleccionado = documento;
    this.nuevoPago.documentoId = documento.id;
    this.nuevoPago.montoPago = documento.montoSaldo; // Sugerir pago completo
    this.vistaActual = 'nuevo-pago';
  }

  async registrarPago(): Promise<void> {
    if (!this.validarPago()) return;

    const documento = this.documentosPorCobrar.find(d => d.id === this.nuevoPago.documentoId);
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

    console.log('💰 Pago registrado:', this.nuevoPago);
    this.mostrarExito(`Pago de ${this.formatCurrency(this.nuevoPago.montoPago)} registrado correctamente`);

    // ✅ CORREGIDO: Reinicializar después de registrar
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

    const documento = this.documentosPorCobrar.find(d => d.id === this.nuevoPago.documentoId);
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

  // Gestión de clientes
  inicializarNuevoCliente(): Tercero {
    return {
      id: 0,
      tipo: 'CLIENTE',
      nit: '',
      razonSocial: '',
      email: '',
      telefono: '',
      direccion: '',
      activo: true,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };
  }

  agregarCliente(): void {
    if (!this.nuevoCliente.nit || !this.nuevoCliente.razonSocial) {
      this.mostrarError('NIT y Razón Social son obligatorios');
      return;
    }

    this.nuevoCliente.id = Date.now();
    this.clientes.push({...this.nuevoCliente});
    
    this.mostrarExito('Cliente agregado correctamente');
    this.nuevoCliente = this.inicializarNuevoCliente();

    // Animación
    anime({
      targets: '.cliente-card:last-child',
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 400,
      easing: 'easeOutBack'
    });
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

  getPagosPorDocumento(documentoId: number): PagoCobro[] {
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

  getSaldoPorCliente(clienteId: number): number {
    return this.documentosPorCobrar
      .filter(d => d.cliente.id === clienteId)
      .reduce((total, d) => total + d.montoSaldo, 0);
  }

  getDocumentoPorId(documentoId: number): DocumentoPorCobrar | undefined {
    return this.documentosPorCobrar.find(d => d.id === documentoId);
  }

  getNumeroDocumento(documentoId: number): string {
    const documento = this.getDocumentoPorId(documentoId);
    return documento?.numeroDocumento || 'N/A';
  }

  getRazonSocialCliente(documentoId: number): string {
    const documento = this.getDocumentoPorId(documentoId);
    return documento?.cliente.razonSocial || 'N/A';
  }
}
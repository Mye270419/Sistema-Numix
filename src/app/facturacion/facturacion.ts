import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';
import { SiatService, CUFDResponse } from '../siat';

// Declarar anime.js
declare var anime: any;

interface Cliente {
  id: number;
  nit: string;
  razonSocial: string;
  email: string;
  telefono: string;
  direccion: string;
}

interface ProductoServicio {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  activo: boolean;
}

interface DetalleFactura {
  id: number;
  producto: ProductoServicio;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

interface Factura {
  id: number;
  numeroFactura: number;
  fechaEmision: string;
  fechaVencimiento: string;
  cliente: Cliente;
  detalles: DetalleFactura[];
  subtotal: number;
  descuentoTotal: number;
  impuestos: number;
  total: number;
  estado: 'BORRADOR' | 'ENVIADA_SIAT' | 'VALIDADA_SIAT' | 'PAGADA' | 'ANULADA';
  cuf?: string;
  codigoControl?: string;
  observaciones: string;
}

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.html',
  styleUrls: ['./facturacion.css']
})
export class FacturacionComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;
  @ViewChild('siatStatus') siatStatus!: ElementRef;

  // Estado de la vista
  vistaActual: 'facturas' | 'nueva-factura' | 'clientes' = 'facturas';
  
  // Estado SIAT
  cufdVigente: CUFDResponse | null = null;
  conexionSiat = false;
  cargandoCUFD = false;

  // Clientes
  clientes: Cliente[] = [
    {
      id: 1,
      nit: '1234567890',
      razonSocial: 'Empresa Constructora ABC S.R.L.',
      email: 'facturacion@abc.com.bo',
      telefono: '70123456',
      direccion: 'Av. 6 de Agosto #123, La Paz'
    },
    {
      id: 2,
      nit: '9876543210',
      razonSocial: 'Comercial XYZ Ltda.',
      email: 'contabilidad@xyz.bo',
      telefono: '76654321',
      direccion: 'Calle Murillo #456, Santa Cruz'
    },
    {
      id: 3,
      nit: '5555555555',
      razonSocial: 'Servicios Profesionales 123',
      email: 'info@servicios123.bo',
      telefono: '72345678',
      direccion: 'Plaza Principal #789, Cochabamba'
    }
  ];

  // Productos/Servicios
  productos: ProductoServicio[] = [
    { id: 1, codigo: 'SERV001', nombre: 'Consultoría Contable', precio: 500.00, activo: true },
    { id: 2, codigo: 'SERV002', nombre: 'Declaración Impuestos', precio: 300.00, activo: true },
    { id: 3, codigo: 'SERV003', nombre: 'Auditoría Interna', precio: 1200.00, activo: true },
    { id: 4, codigo: 'SERV004', nombre: 'Capacitación Contable', precio: 800.00, activo: true },
    { id: 5, codigo: 'PROD001', nombre: 'Software Contable NUMIX', precio: 2500.00, activo: true }
  ];

  // Facturas existentes
  facturas: Factura[] = [
    {
      id: 1,
      numeroFactura: 1,
      fechaEmision: '2024-09-20',
      fechaVencimiento: '2024-10-20',
      cliente: this.clientes[0],
      detalles: [
        {
          id: 1,
          producto: this.productos[0],
          cantidad: 2,
          precioUnitario: 500.00,
          descuento: 0,
          subtotal: 1000.00
        }
      ],
      subtotal: 1000.00,
      descuentoTotal: 0,
      impuestos: 130.00, // IVA 13%
      total: 1130.00,
      estado: 'VALIDADA_SIAT',
      cuf: 'A1B2C3D4E5F6789012345678901234567890',
      codigoControl: 'XY123456',
      observaciones: 'Consultoría para implementación sistema contable'
    }
  ];

  // Nueva factura
  nuevaFactura: Factura = this.inicializarNuevaFactura();
  nuevoDetalle: DetalleFactura = this.inicializarNuevoDetalle();
  clienteSeleccionado: Cliente | null = null;

  // Nuevo cliente
  nuevoCliente: Cliente = {
    id: 0,
    nit: '',
    razonSocial: '',
    email: '',
    telefono: '',
    direccion: ''
  };

  constructor(
    public authService: AuthService,
    private router: Router,
    private siatService: SiatService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    console.log('🧾 Módulo Facturación iniciado');
    this.verificarEstadoSiat();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startModuleAnimation();
    }, 300);
  }

  startModuleAnimation(): void {
    console.log('🎨 Animando módulo Facturación...');

    anime({
      targets: this.container.nativeElement,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      easing: 'easeOutCubic'
    });

    // Animar indicador SIAT
    anime({
      targets: this.siatStatus.nativeElement,
      scale: [0.8, 1.1, 1],
      duration: 1000,
      delay: 500,
      easing: 'easeOutElastic'
    });
  }

  // Gestión SIAT
  async verificarEstadoSiat(): Promise<void> {
    const estado = await this.siatService.verificarConexionSiat();
    this.conexionSiat = estado.conectado;
    this.cufdVigente = this.siatService.getCUFDVigente();
    
    console.log('🌐 Estado SIAT:', estado.mensaje);
  }

  async solicitarCUFD(): Promise<void> {
    this.cargandoCUFD = true;
    
    try {
      this.cufdVigente = await this.siatService.solicitarCUFD();
      this.mostrarExito('CUFD obtenido correctamente');
      
      // Animación de éxito
      anime({
        targets: '.siat-cufd',
        backgroundColor: ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)'],
        duration: 1000,
        easing: 'easeInOutCubic'
      });
      
    } catch (error) {
      this.mostrarError('Error al solicitar CUFD');
    } finally {
      this.cargandoCUFD = false;
    }
  }

  // Navegación
  cambiarVista(vista: 'facturas' | 'nueva-factura' | 'clientes'): void {
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

  // Gestión de facturas
  inicializarNuevaFactura(): Factura {
    return {
      id: 0,
      numeroFactura: this.facturas.length + 1,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cliente: this.clientes[0],
      detalles: [],
      subtotal: 0,
      descuentoTotal: 0,
      impuestos: 0,
      total: 0,
      estado: 'BORRADOR',
      observaciones: ''
    };
  }

  inicializarNuevoDetalle(): DetalleFactura {
    return {
      id: 0,
      producto: this.productos[0],
      cantidad: 1,
      precioUnitario: 0,
      descuento: 0,
      subtotal: 0
    };
  }

  seleccionarCliente(): void {
    if (this.clienteSeleccionado) {
      this.nuevaFactura.cliente = this.clienteSeleccionado;
    }
  }

  seleccionarProducto(): void {
    if (this.nuevoDetalle.producto) {
      this.nuevoDetalle.precioUnitario = this.nuevoDetalle.producto.precio;
      this.calcularSubtotalDetalle();
    }
  }

  calcularSubtotalDetalle(): void {
    this.nuevoDetalle.subtotal = (this.nuevoDetalle.cantidad * this.nuevoDetalle.precioUnitario) - this.nuevoDetalle.descuento;
  }

  agregarDetalle(): void {
    if (this.nuevoDetalle.producto && this.nuevoDetalle.cantidad > 0) {
      this.calcularSubtotalDetalle();
      this.nuevoDetalle.id = Date.now();
      
      this.nuevaFactura.detalles.push({...this.nuevoDetalle});
      this.calcularTotalesFactura();
      
      // Reiniciar detalle
      this.nuevoDetalle = this.inicializarNuevoDetalle();
      
      // Animación
      anime({
        targets: '.detalle-item:last-child',
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack'
      });
    }
  }

  eliminarDetalle(index: number): void {
    anime({
      targets: `.detalle-item:nth-child(${index + 1})`,
      scale: [1, 0],
      opacity: [1, 0],
      duration: 300,
      complete: () => {
        this.nuevaFactura.detalles.splice(index, 1);
        this.calcularTotalesFactura();
      }
    });
  }

  calcularTotalesFactura(): void {
    this.nuevaFactura.subtotal = this.nuevaFactura.detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
    this.nuevaFactura.impuestos = this.nuevaFactura.subtotal * 0.13; // IVA 13% Bolivia
    this.nuevaFactura.total = this.nuevaFactura.subtotal + this.nuevaFactura.impuestos - this.nuevaFactura.descuentoTotal;
  }

  async guardarFactura(): Promise<void> {
    if (!this.validarFactura()) return;

    this.nuevaFactura.id = Date.now();
    this.nuevaFactura.estado = 'BORRADOR';
    
    // Agregar a lista de facturas
    this.facturas.push({...this.nuevaFactura});
    
    console.log('💾 Factura guardada:', this.nuevaFactura);
    this.mostrarExito('Factura guardada como borrador');
    
    // Reiniciar formulario
    this.nuevaFactura = this.inicializarNuevaFactura();
    this.vistaActual = 'facturas';
  }

  async enviarFacturaASiat(factura: Factura): Promise<void> {
    if (!this.cufdVigente) {
      this.mostrarError('Debe solicitar un CUFD vigente primero');
      return;
    }

    try {
      factura.estado = 'ENVIADA_SIAT';
      
      const resultado = await this.siatService.enviarFactura({
        numero: factura.numeroFactura,
        fecha: factura.fechaEmision,
        cliente: factura.cliente,
        detalles: factura.detalles,
        total: factura.total
      });

      if (resultado.exito && resultado.cuf) {
        factura.cuf = resultado.cuf;
        factura.estado = 'VALIDADA_SIAT';
        this.mostrarExito('Factura enviada y validada por SIAT');
        
        // Animación de éxito
        anime({
          targets: `.factura-${factura.id}`,
          backgroundColor: ['transparent', 'rgba(16, 185, 129, 0.2)', 'transparent'],
          duration: 1500,
          easing: 'easeInOutCubic'
        });
        
      } else {
        factura.estado = 'BORRADOR';
        this.mostrarError(resultado.mensaje);
      }
      
    } catch (error) {
      factura.estado = 'BORRADOR';
      this.mostrarError('Error al enviar factura a SIAT');
    }
  }

  validarFactura(): boolean {
    if (!this.nuevaFactura.cliente) {
      this.mostrarError('Debe seleccionar un cliente');
      return false;
    }
    
    if (this.nuevaFactura.detalles.length === 0) {
      this.mostrarError('Debe agregar al menos un producto o servicio');
      return false;
    }
    
    if (this.nuevaFactura.total <= 0) {
      this.mostrarError('El total de la factura debe ser mayor a cero');
      return false;
    }
    
    return true;
  }

  // Gestión de clientes
  agregarCliente(): void {
    if (!this.nuevoCliente.nit || !this.nuevoCliente.razonSocial) {
      this.mostrarError('NIT y Razón Social son obligatorios');
      return;
    }

    this.nuevoCliente.id = Date.now();
    this.clientes.push({...this.nuevoCliente});
    
    // Reiniciar formulario
    this.nuevoCliente = {
      id: 0,
      nit: '',
      razonSocial: '',
      email: '',
      telefono: '',
      direccion: ''
    };
    
    this.mostrarExito('Cliente agregado correctamente');
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
      case 'BORRADOR': return 'badge-draft';
      case 'ENVIADA_SIAT': return 'badge-sending';
      case 'VALIDADA_SIAT': return 'badge-validated';
      case 'PAGADA': return 'badge-paid';
      case 'ANULADA': return 'badge-cancelled';
      default: return 'badge-default';
    }
  }

  mostrarError(mensaje: string): void {
    console.error('❌', mensaje);
    // Implementar toast/modal de error
  }

  mostrarExito(mensaje: string): void {
    console.log('✅', mensaje);
    // Implementar toast/modal de éxito
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
//IMPLEMENTAR EL API DEL SIAT Y EL HTML DE FACTURACION POSTERIORMENTE 
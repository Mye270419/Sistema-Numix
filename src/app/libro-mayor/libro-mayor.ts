
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';

// Declarar anime.js
declare var anime: any;

interface CuentaContable {
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'EGRESO';
  naturaleza: 'DEUDORA' | 'ACREEDORA';
  cuentaPadre?: string;
  nivel: number;
  activa: boolean;
  saldo: number;
}

interface AsientoContable {
  id: number;
  fecha: string;
  descripcion: string;
  referencia: string;
  detalles: DetalleAsiento[];
  totalDebito: number;
  totalCredito: number;
  balanceado: boolean;
  estado: 'BORRADOR' | 'CONFIRMADO' | 'ANULADO';
}

interface DetalleAsiento {
  id: number;
  codigoCuenta: string;
  nombreCuenta: string;
  descripcion: string;
  debito: number;
  credito: number;
}

@Component({
  selector: 'app-libro-mayor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './libro-mayor.html',
  styleUrls: ['./libro-mayor.css']
})
export class LibroMayorComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;

  // Estado de la vista
  vistaActual: 'plan-cuentas' | 'asientos' | 'nuevo-asiento' = 'plan-cuentas';
  
  // Plan de Cuentas Boliviano (según normativa)
  planCuentas: CuentaContable[] = [
    // ACTIVOS
    { codigo: '1', nombre: 'ACTIVOS', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 1, activa: true, saldo: 0 },
    { codigo: '11', nombre: 'ACTIVO CORRIENTE', tipo: 'ACTIVO', naturaleza: 'DEUDORA', cuentaPadre: '1', nivel: 2, activa: true, saldo: 0 },
    { codigo: '1101', nombre: 'Caja y Bancos', tipo: 'ACTIVO', naturaleza: 'DEUDORA', cuentaPadre: '11', nivel: 3, activa: true, saldo: 45000.00 },
    { codigo: '110101', nombre: 'Caja Moneda Nacional', tipo: 'ACTIVO', naturaleza: 'DEUDORA', cuentaPadre: '1101', nivel: 4, activa: true, saldo: 5000.00 },
    { codigo: '110102', nombre: 'Banco Mercantil Santa Cruz', tipo: 'ACTIVO', naturaleza: 'DEUDORA', cuentaPadre: '1101', nivel: 4, activa: true, saldo: 40000.00 },
    { codigo: '1102', nombre: 'Cuentas por Cobrar', tipo: 'ACTIVO', naturaleza: 'DEUDORA', cuentaPadre: '11', nivel: 3, activa: true, saldo: 25000.00 },
    { codigo: '110201', nombre: 'Clientes', tipo: 'ACTIVO', naturaleza: 'DEUDORA', cuentaPadre: '1102', nivel: 4, activa: true, saldo: 25000.00 },
    
    // PASIVOS
    { codigo: '2', nombre: 'PASIVOS', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 1, activa: true, saldo: 0 },
    { codigo: '21', nombre: 'PASIVO CORRIENTE', tipo: 'PASIVO', naturaleza: 'ACREEDORA', cuentaPadre: '2', nivel: 2, activa: true, saldo: 0 },
    { codigo: '2101', nombre: 'Cuentas por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', cuentaPadre: '21', nivel: 3, activa: true, saldo: 15000.00 },
    { codigo: '210101', nombre: 'Proveedores', tipo: 'PASIVO', naturaleza: 'ACREEDORA', cuentaPadre: '2101', nivel: 4, activa: true, saldo: 15000.00 },
    
    // PATRIMONIO
    { codigo: '3', nombre: 'PATRIMONIO', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 1, activa: true, saldo: 0 },
    { codigo: '3101', nombre: 'Capital Social', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', cuentaPadre: '3', nivel: 2, activa: true, saldo: 50000.00 },
    { codigo: '3201', nombre: 'Resultados Acumulados', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', cuentaPadre: '3', nivel: 2, activa: true, saldo: 5000.00 },
    
    // INGRESOS
    { codigo: '4', nombre: 'INGRESOS', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 1, activa: true, saldo: 0 },
    { codigo: '4101', nombre: 'Ingresos por Servicios', tipo: 'INGRESO', naturaleza: 'ACREEDORA', cuentaPadre: '4', nivel: 2, activa: true, saldo: 35000.00 },
    { codigo: '410101', nombre: 'Servicios Contables', tipo: 'INGRESO', naturaleza: 'ACREEDORA', cuentaPadre: '4101', nivel: 3, activa: true, saldo: 35000.00 },
    
    // EGRESOS
    { codigo: '5', nombre: 'EGRESOS', tipo: 'EGRESO', naturaleza: 'DEUDORA', nivel: 1, activa: true, saldo: 0 },
    { codigo: '5101', nombre: 'Gastos Operativos', tipo: 'EGRESO', naturaleza: 'DEUDORA', cuentaPadre: '5', nivel: 2, activa: true, saldo: 25000.00 },
    { codigo: '510101', nombre: 'Sueldos y Salarios', tipo: 'EGRESO', naturaleza: 'DEUDORA', cuentaPadre: '5101', nivel: 3, activa: true, saldo: 15000.00 },
    { codigo: '510102', nombre: 'Servicios Básicos', tipo: 'EGRESO', naturaleza: 'DEUDORA', cuentaPadre: '5101', nivel: 3, activa: true, saldo: 2500.00 },
    { codigo: '510103', nombre: 'Material de Oficina', tipo: 'EGRESO', naturaleza: 'DEUDORA', cuentaPadre: '5101', nivel: 3, activa: true, saldo: 1500.00 }
  ];

  // Asientos contables
  asientos: AsientoContable[] = [
    {
      id: 1,
      fecha: '2024-09-01',
      descripcion: 'Asiento de apertura',
      referencia: 'AST001',
      totalDebito: 70000,
      totalCredito: 70000,
      balanceado: true,
      estado: 'CONFIRMADO',
      detalles: [
        { id: 1, codigoCuenta: '110101', nombreCuenta: 'Caja Moneda Nacional', descripcion: 'Apertura de caja', debito: 5000, credito: 0 },
        { id: 2, codigoCuenta: '110102', nombreCuenta: 'Banco Mercantil Santa Cruz', descripcion: 'Apertura cuenta bancaria', debito: 40000, credito: 0 },
        { id: 3, codigoCuenta: '110201', nombreCuenta: 'Clientes', descripcion: 'Saldos iniciales clientes', debito: 25000, credito: 0 },
        { id: 4, codigoCuenta: '3101', nombreCuenta: 'Capital Social', descripcion: 'Capital inicial', debito: 0, credito: 50000 },
        { id: 5, codigoCuenta: '3201', nombreCuenta: 'Resultados Acumulados', descripcion: 'Utilidades anteriores', debito: 0, credito: 5000 },
        { id: 6, codigoCuenta: '210101', nombreCuenta: 'Proveedores', descripcion: 'Saldos iniciales proveedores', debito: 0, credito: 15000 }
      ]
    }
  ];

  // Formulario nuevo asiento
  nuevoAsiento: AsientoContable = {
    id: 0,
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    referencia: '',
    detalles: [],
    totalDebito: 0,
    totalCredito: 0,
    balanceado: false,
    estado: 'BORRADOR'
  };

  // Nuevo detalle
  nuevoDetalle: DetalleAsiento = {
    id: 0,
    codigoCuenta: '',
    nombreCuenta: '',
    descripcion: '',
    debito: 0,
    credito: 0
  };

  // Filtros y búsqueda
  busquedaCuenta = '';
  filtroTipoCuenta = '';
  cuentasFiltradas: CuentaContable[] = [];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.cuentasFiltradas = [...this.planCuentas];
    console.log('📚 Módulo Libro Mayor iniciado');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startModuleAnimation();
    }, 300);
  }

  startModuleAnimation(): void {
    console.log('🎨 Animando módulo Libro Mayor...');

    anime({
      targets: this.container.nativeElement,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      easing: 'easeOutCubic'
    });

    // Animar elementos de la interfaz
    anime({
      targets: '.module-header',
      translateY: [-20, 0],
      opacity: [0, 1],
      duration: 600,
      delay: 200,
      easing: 'easeOutCubic'
    });

    anime({
      targets: '.nav-tabs .tab',
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 400,
      delay: anime.stagger(100, {start: 400}),
      easing: 'easeOutBack'
    });
  }

  // Navegación entre vistas
  cambiarVista(vista: 'plan-cuentas' | 'asientos' | 'nuevo-asiento'): void {
    this.vistaActual = vista;
    
    // Animación de cambio de vista
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

  // Gestión de Plan de Cuentas
  filtrarCuentas(): void {
    let cuentas = [...this.planCuentas];
    
    if (this.busquedaCuenta) {
      cuentas = cuentas.filter(cuenta => 
        cuenta.codigo.toLowerCase().includes(this.busquedaCuenta.toLowerCase()) ||
        cuenta.nombre.toLowerCase().includes(this.busquedaCuenta.toLowerCase())
      );
    }
    
    if (this.filtroTipoCuenta) {
      cuentas = cuentas.filter(cuenta => cuenta.tipo === this.filtroTipoCuenta);
    }
    
    this.cuentasFiltradas = cuentas;
  }

  // Gestión de Asientos Contables
  agregarDetalle(): void {
    if (this.nuevoDetalle.codigoCuenta && (this.nuevoDetalle.debito > 0 || this.nuevoDetalle.credito > 0)) {
      const cuenta = this.planCuentas.find(c => c.codigo === this.nuevoDetalle.codigoCuenta);
      if (cuenta) {
        this.nuevoDetalle.nombreCuenta = cuenta.nombre;
        this.nuevoDetalle.id = Date.now();
        
        this.nuevoAsiento.detalles.push({...this.nuevoDetalle});
        this.calcularTotales();
        
        // Limpiar formulario
        this.nuevoDetalle = {
          id: 0,
          codigoCuenta: '',
          nombreCuenta: '',
          descripcion: '',
          debito: 0,
          credito: 0
        };

        // Animación de agregado
        anime({
          targets: '.detalle-item:last-child',
          scale: [0.8, 1],
          opacity: [0, 1],
          duration: 400,
          easing: 'easeOutBack'
        });
      }
    }
  }

  eliminarDetalle(index: number): void {
    anime({
      targets: `.detalle-item:nth-child(${index + 1})`,
      scale: [1, 0],
      opacity: [1, 0],
      duration: 300,
      easing: 'easeInBack',
      complete: () => {
        this.nuevoAsiento.detalles.splice(index, 1);
        this.calcularTotales();
      }
    });
  }

  calcularTotales(): void {
    this.nuevoAsiento.totalDebito = this.nuevoAsiento.detalles.reduce((total, detalle) => total + detalle.debito, 0);
    this.nuevoAsiento.totalCredito = this.nuevoAsiento.detalles.reduce((total, detalle) => total + detalle.credito, 0);
    this.nuevoAsiento.balanceado = this.nuevoAsiento.totalDebito === this.nuevoAsiento.totalCredito && this.nuevoAsiento.totalDebito > 0;
  }

  guardarAsiento(): void {
    if (!this.nuevoAsiento.balanceado || !this.nuevoAsiento.descripcion) {
      this.mostrarError('El asiento debe estar balanceado y tener descripción');
      return;
    }

    this.nuevoAsiento.id = Date.now();
    this.nuevoAsiento.referencia = `AST${String(this.asientos.length + 1).padStart(3, '0')}`;
    this.nuevoAsiento.estado = 'CONFIRMADO';

    this.asientos.push({...this.nuevoAsiento});
    
    // Actualizar saldos de cuentas
    this.actualizarSaldos();
    
    console.log('💾 Asiento guardado:', this.nuevoAsiento);
    
    // Limpiar formulario
    this.limpiarFormulario();
    
    // Volver a vista de asientos
    this.vistaActual = 'asientos';

    // Animación de éxito
    this.mostrarExito('Asiento guardado correctamente');
  }

  actualizarSaldos(): void {
    // Actualizar saldos de cuentas según el nuevo asiento
    this.nuevoAsiento.detalles.forEach(detalle => {
      const cuenta = this.planCuentas.find(c => c.codigo === detalle.codigoCuenta);
      if (cuenta) {
        if (cuenta.naturaleza === 'DEUDORA') {
          cuenta.saldo += (detalle.debito - detalle.credito);
        } else {
          cuenta.saldo += (detalle.credito - detalle.debito);
        }
      }
    });
  }

  limpiarFormulario(): void {
    this.nuevoAsiento = {
      id: 0,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      referencia: '',
      detalles: [],
      totalDebito: 0,
      totalCredito: 0,
      balanceado: false,
      estado: 'BORRADOR'
    };
  }

  // Funciones utilitarias
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  }

  getIndentStyle(nivel: number): string {
    return `${(nivel - 1) * 20}px`;
  }

  getCuentasPorNivel(nivel: number): CuentaContable[] {
    return this.cuentasFiltradas.filter(cuenta => cuenta.nivel === nivel);
  }

  onCuentaSeleccionada(): void {
    const cuenta = this.planCuentas.find(c => c.codigo === this.nuevoDetalle.codigoCuenta);
    if (cuenta) {
      this.nuevoDetalle.nombreCuenta = cuenta.nombre;
    }
  }

  mostrarError(mensaje: string): void {
    console.error('❌', mensaje);
    // Implementar toast o modal de error
  }

  mostrarExito(mensaje: string): void {
    console.log('✅', mensaje);
    // Implementar toast o modal de éxito
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
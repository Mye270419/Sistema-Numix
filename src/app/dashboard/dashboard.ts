// ====================================
// PASO 1: dashboard.component.ts
// ====================================
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../auth';

// Declarar anime.js
declare var anime: any;

interface DashboardMetrics {
  ingresosMes: number;
  egresosMes: number;
  saldoActual: number;
  facturasPendientes: number;
  clientesActivos: number;
  transaccionesHoy: number;
}

interface RecentTransaction {
  id: number;
  fecha: string;
  descripcion: string;
  tipo: 'ingreso' | 'egreso' | 'factura';
  monto: number;
  cliente?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('dashboardContainer') dashboardContainer!: ElementRef;
  @ViewChild('sidebar') sidebar!: ElementRef;
  @ViewChild('mainContent') mainContent!: ElementRef;

  currentUser: User | null = null;
  metrics: DashboardMetrics = {
    ingresosMes: 125450.75,
    egresosMes: 89320.50,
    saldoActual: 245678.25,
    facturasPendientes: 12,
    clientesActivos: 47,
    transaccionesHoy: 8
  };

  recentTransactions: RecentTransaction[] = [
    { id: 1, fecha: '2024-09-24', descripcion: 'Venta de servicios contables', tipo: 'ingreso', monto: 2500.00, cliente: 'Empresa ABC' },
    { id: 2, fecha: '2024-09-24', descripcion: 'Pago de nómina', tipo: 'egreso', monto: 15000.00 },
    { id: 3, fecha: '2024-09-23', descripcion: 'Factura consultoría', tipo: 'factura', monto: 3200.00, cliente: 'Constructora XYZ' },
    { id: 4, fecha: '2024-09-23', descripcion: 'Compra de suministros', tipo: 'egreso', monto: 850.00 },
    { id: 5, fecha: '2024-09-22', descripcion: 'Honorarios profesionales', tipo: 'ingreso', monto: 4500.00, cliente: 'Comercial 123' }
  ];

  sidebarCollapsed = false;
  activeModule = 'dashboard';

  // Módulos disponibles según el rol
  modules = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', route: '/dashboard' },
    { id: 'libro-mayor', name: 'Libro Mayor', icon: '📚', route: '/libro-mayor' },
    { id: 'facturacion', name: 'Facturación', icon: '🧾', route: '/facturacion' },
    { id: 'cuentas-pagar', name: 'Cuentas por Pagar', icon: '💳', route: '/cuentas-pagar' },
    { id: 'cuentas-cobrar', name: 'Cuentas por Cobrar', icon: '💰', route: '/cuentas-cobrar' },
    { id: 'informes', name: 'Informes Financieros', icon: '📈', route: '/informes' },
    { id: 'configuracion', name: 'Configuración', icon: '⚙️', route: '/configuracion' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    // Verificar autenticación
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    console.log('🎛️ Dashboard NUMIX iniciado para:', this.currentUser?.fullName);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startDashboardAnimation();
    }, 300);
  }

  startDashboardAnimation(): void {
    console.log('🎨 Iniciando animaciones del dashboard...');

    // Animación del sidebar
    anime({
      targets: this.sidebar.nativeElement,
      translateX: [-250, 0],
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutCubic'
    });

    // Animación del contenido principal
    anime({
      targets: this.mainContent.nativeElement,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 1000,
      delay: 200,
      easing: 'easeOutCubic'
    });

    // Animación de las métricas
    anime({
      targets: '.metric-card',
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 600,
      delay: anime.stagger(100, {start: 500}),
      easing: 'easeOutBack'
    });

    // Animación de las transacciones
    anime({
      targets: '.transaction-item',
      translateX: [50, 0],
      opacity: [0, 1],
      duration: 500,
      delay: anime.stagger(100, {start: 800}),
      easing: 'easeOutCubic'
    });

    // Partículas de fondo
    this.createBackgroundEffects();
  }

  createBackgroundEffects(): void {
    const container = this.dashboardContainer.nativeElement;
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'bg-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      container.appendChild(particle);

      anime({
        targets: particle,
        opacity: [0, 0.1, 0],
        scale: [0.5, 1, 0.5],
        translateY: [
          () => anime.random(-30, 30),
          () => anime.random(-60, 60)
        ],
        translateX: [
          () => anime.random(-30, 30),
          () => anime.random(-60, 60)
        ],
        duration: () => anime.random(8000, 15000),
        delay: () => anime.random(0, 5000),
        loop: true,
        easing: 'easeInOutSine'
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    
    const sidebar = this.sidebar.nativeElement;
    const targetWidth = this.sidebarCollapsed ? 80 : 280;
    
    anime({
      targets: sidebar,
      width: targetWidth + 'px',
      duration: 400,
      easing: 'easeOutCubic'
    });
  }

  navigateToModule(module: any): void {
    if (module.id === 'dashboard') return;
    
    this.activeModule = module.id;
    
    // Animación de clic
    anime({
      targets: `.module-${module.id}`,
      scale: [1, 0.95, 1],
      duration: 200,
      easing: 'easeInOutCubic'
    });
    // Navegación real
  this.router.navigate([module.route]);

    // Por ahora solo simular navegación
   // console.log(`🔄 Navegando a: ${module.name}`); "volver a activa si no funciona la navegacion real"
    // this.router.navigate([module.route]);
  }

  logout(): void {
    // Animación de logout
    anime({
      targets: this.dashboardContainer.nativeElement,
      opacity: [1, 0],
      scale: [1, 0.95],
      duration: 500,
      easing: 'easeInCubic',
      complete: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
      
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  }

  getTransactionIcon(tipo: string): string {
    switch (tipo) {
      case 'ingreso': return '📈';
      case 'egreso': return '📉';
      case 'factura': return '🧾';
      default: return '💼';
    }
  }

  getTransactionColor(tipo: string): string {
    switch (tipo) {
      case 'ingreso': return '#10b981'; // Verde
      case 'egreso': return '#ef4444';  // Rojo
      case 'factura': return '#3b82f6'; // Azul
      default: return '#6b7280';        // Gris
    }
  }

  // Funciones para acciones rápidas
  crearFactura(): void {
    console.log('🧾 Creando nueva factura...');
    // Implementar lógica
  }

  registrarPago(): void {
    console.log('💰 Registrando nuevo pago...');
    // Implementar lógica
  }

  nuevoAsiento(): void {
    console.log('📝 Creando nuevo asiento contable...');
    // Implementar lógica
  }

  verInformes(): void {
    console.log('📊 Accediendo a informes...');
    // Implementar lógica
  }
}
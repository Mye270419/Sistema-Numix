import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../auth';

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

// Agrupación visual del menú
interface ModuleGroup {
  label: string;
  items: Module[];
}

interface Module {
  id: string;
  name: string;
  icon: string;
  route: string;
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
  today = new Date();

  // ── Módulos agrupados ──────────────────────────────────
  moduleGroups: ModuleGroup[] = [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard',    name: 'Dashboard',           icon: '📊', route: '/dashboard' },
      ]
    },
    {
      label: 'Contabilidad',
      items: [
        { id: 'libro-mayor',  name: 'Libro Mayor',         icon: '📚', route: '/libro-mayor' },
        { id: 'facturacion',  name: 'Facturación',         icon: '🧾', route: '/facturacion' },
        { id: 'cuentas-pagar',name: 'Cuentas por Pagar',   icon: '💳', route: '/cuentas-pagar' },
        { id: 'cuentas-cobrar',name:'Cuentas por Cobrar',  icon: '💰', route: '/cuentas-cobrar' },
        { id: 'informes',     name: 'Informes Financieros',icon: '📈', route: '/informes' },
      ]
    },
    {
      label: 'Gestión',
      items: [
        { id: 'nominas',      name: 'Nóminas',             icon: '👥', route: '/nominas' },
        { id: 'activos-fijos',name: 'Activos Fijos',       icon: '🏗️', route: '/activos-fijos' },
        { id: 'inventario',   name: 'Inventario',          icon: '📦', route: '/inventario' },
      ]
    },
    {
      label: 'Sistema',
      items: [
        { id: 'auditoria',    name: 'Auditoría',           icon: '🔍', route: '/auditoria' },
        { id: 'configuracion',name: 'Configuración',       icon: '⚙️', route: '/configuracion' },
      ]
    }
  ];

  // Lista plana para compatibilidad con el HTML existente
  get modules(): Module[] {
    return this.moduleGroups.flatMap(g => g.items);
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    console.log('🎛️ Dashboard NUMIX iniciado para:', this.currentUser?.fullName);
  }

  ngAfterViewInit(): void {
    setTimeout(() => { this.startDashboardAnimation(); }, 300);
  }

  startDashboardAnimation(): void {
    anime({
      targets: this.sidebar.nativeElement,
      translateX: [-250, 0], opacity: [0, 1],
      duration: 800, easing: 'easeOutCubic'
    });
    anime({
      targets: this.mainContent.nativeElement,
      opacity: [0, 1], translateY: [30, 0],
      duration: 1000, delay: 200, easing: 'easeOutCubic'
    });
    anime({
      targets: '.metric-card',
      scale: [0.8, 1], opacity: [0, 1],
      duration: 600, delay: anime.stagger(100, { start: 500 }),
      easing: 'easeOutBack'
    });
    anime({
      targets: '.transaction-item',
      translateX: [50, 0], opacity: [0, 1],
      duration: 500, delay: anime.stagger(100, { start: 800 }),
      easing: 'easeOutCubic'
    });
    this.createBackgroundEffects();
  }

  createBackgroundEffects(): void {
    const container = this.dashboardContainer.nativeElement;
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'bg-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top  = Math.random() * 100 + '%';
      container.appendChild(particle);
      anime({
        targets: particle,
        opacity: [0, 0.1, 0], scale: [0.5, 1, 0.5],
        translateY: [() => anime.random(-30, 30), () => anime.random(-60, 60)],
        translateX: [() => anime.random(-30, 30), () => anime.random(-60, 60)],
        duration: () => anime.random(8000, 15000),
        delay: () => anime.random(0, 5000),
        loop: true, easing: 'easeInOutSine'
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    anime({
      targets: this.sidebar.nativeElement,
      width: (this.sidebarCollapsed ? 80 : 280) + 'px',
      duration: 400, easing: 'easeOutCubic'
    });
  }

  navigateToModule(module: Module): void {
    if (module.id === 'dashboard') return;
    this.activeModule = module.id;
    anime({
      targets: `.module-${module.id}`,
      scale: [1, 0.95, 1], duration: 200, easing: 'easeInOutCubic'
    });
    this.router.navigate([module.route]);
  }

  logout(): void {
    anime({
      targets: this.dashboardContainer.nativeElement,
      opacity: [1, 0], scale: [1, 0.95], duration: 500, easing: 'easeInCubic',
      complete: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  }

  getTransactionIcon(tipo: string): string {
    const icons: Record<string, string> = { ingreso: '📈', egreso: '📉', factura: '🧾' };
    return icons[tipo] || '💼';
  }

  getTransactionColor(tipo: string): string {
    const colors: Record<string, string> = { ingreso: '#10b981', egreso: '#ef4444', factura: '#3b82f6' };
    return colors[tipo] || '#6b7280';
  }

  crearFactura():    void { this.router.navigate(['/facturacion']); }
  registrarPago():   void { this.router.navigate(['/cuentas-pagar']); }
  nuevoAsiento():    void { this.router.navigate(['/libro-mayor']); }
  verInformes():     void { this.router.navigate(['/informes']); }
}

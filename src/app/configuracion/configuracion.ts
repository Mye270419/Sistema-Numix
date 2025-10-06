import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../auth';

// Declarar anime.js "libreria de animaciones"
declare var anime: any;

interface Usuario {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'administrador' | 'contador' | 'gerente' | 'facturador';
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

interface Empresa {
  nit: string;
  razonSocial: string;
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  pais: string;
  logo?: string;
}

interface ParametrosSistema {
  idioma: string;
  moneda: string;
  formatoFecha: string;
  timezone: string;
  facturaAutonumerica: boolean;
  proximoNumeroFactura: number;
  iva: number;
  backupAutomatico: boolean;
  frecuenciaBackup: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css']
})
export class ConfiguracionComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;

  // Estado de la vista
  vistaActual: 'general' | 'usuarios' | 'empresa' | 'sistema' | 'seguridad' = 'general';

  // Usuarios del sistema
  usuarios: Usuario[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@numix.bo',
      fullName: 'Administrador NUMIX',
      role: 'administrador',
      activo: true,
      fechaCreacion: '2024-01-15',
      ultimoAcceso: '2024-09-26'
    },
    {
      id: 2,
      username: 'contador1',
      email: 'contador@numix.bo',
      fullName: 'Juan Pérez',
      role: 'contador',
      activo: true,
      fechaCreacion: '2024-02-20',
      ultimoAcceso: '2024-09-25'
    },
    {
      id: 3,
      username: 'gerente1',
      email: 'gerente@numix.bo',
      fullName: 'María López',
      role: 'gerente',
      activo: true,
      fechaCreacion: '2024-03-10',
      ultimoAcceso: '2024-09-24'
    }
  ];

  // Nuevo usuario
  nuevoUsuario: Usuario = this.inicializarNuevoUsuario();

  // Datos de la empresa
  empresa: Empresa = {
    nit: '1234567890',
    razonSocial: 'NUMIX Contabilidad S.R.L.',
    direccion: 'Av. 6 de Agosto #1234, Edificio Torre Empresarial, Piso 5',
    telefono: '2-2123456',
    email: 'contacto@numix.bo',
    ciudad: 'La Paz',
    pais: 'Bolivia'
  };

  // Parámetros del sistema
  parametros: ParametrosSistema = {
    idioma: 'es',
    moneda: 'BOB',
    formatoFecha: 'dd/MM/yyyy',
    timezone: 'America/La_Paz',
    facturaAutonumerica: true,
    proximoNumeroFactura: 1001,
    iva: 13,
    backupAutomatico: true,
    frecuenciaBackup: 'diario'
  };

  // Variables de contraseña
  cambioPassword = {
    passwordActual: '',
    passwordNuevo: '',
    passwordConfirmar: ''
  };

  // Estado de guardado
  guardando = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    // Verificar que sea administrador
    if (!this.authService.isAdmin) {
      console.warn('⚠️ Acceso denegado: Solo administradores');
      this.router.navigate(['/dashboard']);
      return;
    }

    console.log('⚙️ Módulo Configuración iniciado');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startModuleAnimation();
    }, 300);
  }

  startModuleAnimation(): void {
    console.log('🎨 Animando módulo Configuración...');

    anime({
      targets: this.container.nativeElement,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      easing: 'easeOutCubic'
    });

    anime({
      targets: '.config-card',
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 600,
      delay: anime.stagger(100, {start: 400}),
      easing: 'easeOutBack'
    });
  }

  // Navegación
  cambiarVista(vista: 'general' | 'usuarios' | 'empresa' | 'sistema' | 'seguridad'): void {
    this.vistaActual = vista;
    this.limpiarMensajes();
    
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

  // Gestión de usuarios
  inicializarNuevoUsuario(): Usuario {
    return {
      id: 0,
      username: '',
      email: '',
      fullName: '',
      role: 'contador',
      activo: true,
      fechaCreacion: new Date().toISOString().split('T')[0]
    };
  }

  agregarUsuario(): void {
    if (!this.validarNuevoUsuario()) return;

    this.nuevoUsuario.id = Date.now();
    this.usuarios.push({...this.nuevoUsuario});
    
    this.mostrarExito('Usuario creado correctamente');
    this.nuevoUsuario = this.inicializarNuevoUsuario();

    anime({
      targets: '.usuario-card:last-child',
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 400,
      easing: 'easeOutBack'
    });
  }

  validarNuevoUsuario(): boolean {
    if (!this.nuevoUsuario.username || !this.nuevoUsuario.email || !this.nuevoUsuario.fullName) {
      this.mostrarError('Complete todos los campos obligatorios');
      return false;
    }

    if (this.usuarios.find(u => u.username === this.nuevoUsuario.username)) {
      this.mostrarError('El nombre de usuario ya existe');
      return false;
    }

    if (this.usuarios.find(u => u.email === this.nuevoUsuario.email)) {
      this.mostrarError('El email ya está registrado');
      return false;
    }

    return true;
  }

  toggleUsuarioActivo(usuario: Usuario): void {
    usuario.activo = !usuario.activo;
    this.mostrarExito(`Usuario ${usuario.activo ? 'activado' : 'desactivado'}`);
  }

  eliminarUsuario(usuario: Usuario): void {
    if (usuario.role === 'administrador') {
      this.mostrarError('No se puede eliminar un administrador');
      return;
    }

    if (confirm(`¿Está seguro de eliminar el usuario ${usuario.fullName}?`)) {
      const index = this.usuarios.findIndex(u => u.id === usuario.id);
      if (index > -1) {
        this.usuarios.splice(index, 1);
        this.mostrarExito('Usuario eliminado correctamente');
      }
    }
  }

  // Gestión de empresa
  guardarDatosEmpresa(): void {
    if (!this.validarEmpresa()) return;

    this.guardando = true;
    
    setTimeout(() => {
      this.guardando = false;
      this.mostrarExito('Datos de la empresa guardados correctamente');
      console.log('💾 Empresa actualizada:', this.empresa);
    }, 1000);
  }

  validarEmpresa(): boolean {
    if (!this.empresa.nit || !this.empresa.razonSocial) {
      this.mostrarError('NIT y Razón Social son obligatorios');
      return false;
    }
    return true;
  }

  // Gestión de parámetros del sistema
  guardarParametros(): void {
    this.guardando = true;
    
    setTimeout(() => {
      this.guardando = false;
      this.mostrarExito('Parámetros del sistema guardados correctamente');
      console.log('💾 Parámetros actualizados:', this.parametros);
    }, 1000);
  }

  // Seguridad
  cambiarPassword(): void {
    if (!this.validarCambioPassword()) return;

    this.guardando = true;

    setTimeout(() => {
      this.guardando = false;
      this.mostrarExito('Contraseña cambiada correctamente');
      this.limpiarFormularioPassword();
    }, 1000);
  }

  validarCambioPassword(): boolean {
    if (!this.cambioPassword.passwordActual || !this.cambioPassword.passwordNuevo || !this.cambioPassword.passwordConfirmar) {
      this.mostrarError('Complete todos los campos');
      return false;
    }

    if (this.cambioPassword.passwordNuevo !== this.cambioPassword.passwordConfirmar) {
      this.mostrarError('Las contraseñas nuevas no coinciden');
      return false;
    }

    if (this.cambioPassword.passwordNuevo.length < 6) {
      this.mostrarError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  }

  limpiarFormularioPassword(): void {
    this.cambioPassword = {
      passwordActual: '',
      passwordNuevo: '',
      passwordConfirmar: ''
    };
  }

  // Backup y restauración
  generarBackup(): void {
    console.log('💾 Generando backup del sistema...');
    this.mostrarExito('Backup generado correctamente');
  }

  restaurarBackup(): void {
    if (confirm('¿Está seguro de restaurar el backup? Esto sobrescribirá los datos actuales.')) {
      console.log('🔄 Restaurando backup...');
      this.mostrarExito('Backup restaurado correctamente');
    }
  }

  exportarDatos(): void {
    console.log('📤 Exportando datos del sistema...');
    this.mostrarExito('Datos exportados correctamente');
  }

  // Utilidades
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'administrador': return 'role-admin';
      case 'contador': return 'role-contador';
      case 'gerente': return 'role-gerente';
      case 'facturador': return 'role-facturador';
      default: return 'role-default';
    }
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      'administrador': 'Administrador',
      'contador': 'Contador',
      'gerente': 'Gerente',
      'facturador': 'Facturador'
    };
    return labels[role] || role;
  }

  mostrarExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mensajeError = '';
    setTimeout(() => this.mensajeExito = '', 5000);
  }

  mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mensajeExito = '';
    setTimeout(() => this.mensajeError = '', 5000);
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
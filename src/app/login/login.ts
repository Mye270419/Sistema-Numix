import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';

declare var anime: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('loginContainer') loginContainer!: ElementRef;
  @ViewChild('loginForm') loginForm!: ElementRef;
  @ViewChild('numixLogo') numixLogo!: ElementRef;

  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  showDemo: boolean = true;
  // Alternar entre login y registro
  modoRegistro: boolean = false;

  // Campos de registro
  registroForm = {
    nombreEmpresa: '',
    nit: '',
    nombreCompleto: '',
    email: '',
    password: '',
    confirmarPassword: '',
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => { this.startLoginAnimation(); }, 500);
  }

  startLoginAnimation(): void {
    anime({
      targets: this.numixLogo.nativeElement,
      opacity: [0, 1], scale: [0.8, 1],
      duration: 800, easing: 'easeOutCubic'
    });
    anime({
      targets: this.loginForm.nativeElement,
      opacity: [0, 1], translateY: [30, 0],
      duration: 1000, delay: 400, easing: 'easeOutCubic'
    });
    this.createBackgroundParticles();
  }

  createBackgroundParticles(): void {
    const container = this.loginContainer.nativeElement;
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'bg-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top  = Math.random() * 100 + '%';
      container.appendChild(particle);
      anime({
        targets: particle,
        opacity: [0, 0.3, 0], scale: [0.5, 1, 0.5],
        translateY: [() => anime.random(-20, 20), () => anime.random(-40, 40)],
        translateX: [() => anime.random(-20, 20), () => anime.random(-40, 40)],
        duration: () => anime.random(4000, 8000),
        delay: () => anime.random(0, 2000),
        loop: true, easing: 'easeInOutSine'
      });
    }
  }

  // ── LOGIN ──────────────────────────────────────────────
  async onLogin(): Promise<void> {
    if (!this.username || !this.password) {
      this.showError('Por favor ingrese usuario y contraseña');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    anime({ targets: '.login-btn', scale: [1, 0.95, 1], duration: 300, easing: 'easeInOutCubic' });

    try {
      const success = await this.authService.login(this.username, this.password);

      if (success) {
        anime({
          targets: this.loginForm.nativeElement,
          scale: [1, 1.05, 1], opacity: [1, 0.8, 1],
          duration: 600, easing: 'easeInOutCubic',
          complete: () => { this.router.navigate(['/dashboard']); }
        });
      } else {
        this.showError('Credenciales incorrectas. Verifique su email y contraseña.');
      }
    } catch {
      this.showError('Error de conexión. Intente nuevamente.');
    } finally {
      this.isLoading = false;
    }
  }

  // ── REGISTRO ───────────────────────────────────────────
  async onRegistro(): Promise<void> {
    if (this.registroForm.password !== this.registroForm.confirmarPassword) {
      this.showError('Las contraseñas no coinciden');
      return;
    }
    if (!this.registroForm.nombreEmpresa || !this.registroForm.nit ||
        !this.registroForm.email || !this.registroForm.password) {
      this.showError('Complete todos los campos obligatorios');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result = await this.authService.registrarEmpresa({
        nombreEmpresa:  this.registroForm.nombreEmpresa,
        nit:            this.registroForm.nit,
        email:          this.registroForm.email,
        password:       this.registroForm.password,
        nombreCompleto: this.registroForm.nombreCompleto,
      });

      if (result.success) {
        this.showDemo = false;
        this.modoRegistro = false;
        this.username = this.registroForm.email;
        this.password = this.registroForm.password;
        this.errorMessage = '';
        // Auto-login después del registro
        await this.onLogin();
      } else {
        this.showError(result.error || 'Error al registrar empresa');
      }
    } catch {
      this.showError('Error de conexión. Intente nuevamente.');
    } finally {
      this.isLoading = false;
    }
  }

  showError(message: string): void {
    this.errorMessage = message;
    anime({
      targets: this.loginForm.nativeElement,
      translateX: [-10, 10, -10, 10, 0],
      duration: 400, easing: 'easeInOutCubic'
    });
  }

  fillDemoCredentials(role: 'admin' | 'contador'): void {
    // Demo usa emails reales de Supabase
    if (role === 'admin') {
      this.username = 'admin@numix.bo';
      this.password = 'admin123';
    } else {
      this.username = 'contador@numix.bo';
      this.password = 'contador123';
    }
    anime({
      targets: '.form-input', scale: [1, 1.02, 1],
      duration: 300, delay: anime.stagger(100), easing: 'easeInOutCubic'
    });
  }

  toggleModo(): void {
    this.modoRegistro = !this.modoRegistro;
    this.errorMessage = '';
    anime({
      targets: this.loginForm.nativeElement,
      opacity: [0.5, 1], translateY: [10, 0],
      duration: 400, easing: 'easeOutCubic'
    });
  }
}

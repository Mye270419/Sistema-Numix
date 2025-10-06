// src/app/login/login.component.ts
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';

// Declarar anime.js
declare var anime: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],  // ✅ ESTO ES CLAVE
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si ya está logueado, redirigir al dashboard
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startLoginAnimation();
    }, 500);
  }

  startLoginAnimation(): void {
    console.log('🎨 Iniciando animación de login...');

    // Animación del logo NUMIX
    anime({
      targets: this.numixLogo.nativeElement,
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 800,
      easing: 'easeOutCubic'
    });

    // Animación del formulario
    anime({
      targets: this.loginForm.nativeElement,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 1000,
      delay: 400,
      easing: 'easeOutCubic'
    });

    // Animación de las partículas de fondo
    this.createBackgroundParticles();
  }

  createBackgroundParticles(): void {
    const container = this.loginContainer.nativeElement;
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'bg-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      container.appendChild(particle);

      anime({
        targets: particle,
        opacity: [0, 0.3, 0],
        scale: [0.5, 1, 0.5],
        translateY: [
          () => anime.random(-20, 20),
          () => anime.random(-40, 40)
        ],
        translateX: [
          () => anime.random(-20, 20),
          () => anime.random(-40, 40)
        ],
        duration: () => anime.random(4000, 8000),
        delay: () => anime.random(0, 2000),
        loop: true,
        easing: 'easeInOutSine'
      });
    }
  }

  async onLogin(): Promise<void> {
    if (!this.username || !this.password) {
      this.showError('Por favor ingrese usuario y contraseña');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Animación de carga en el botón
    anime({
      targets: '.login-btn',
      scale: [1, 0.95, 1],
      duration: 300,
      easing: 'easeInOutCubic'
    });

    try {
      const loginSuccess = await this.authService.login(this.username, this.password);

      if (loginSuccess) {
        console.log('✅ Login exitoso');
        
        // Animación de éxito
        anime({
          targets: this.loginForm.nativeElement,
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 1],
          duration: 600,
          easing: 'easeInOutCubic',
          complete: () => {
            this.router.navigate(['/dashboard']);
          }
        });
      } else {
        this.showError('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      this.showError('Error de conexión. Intente nuevamente.');
    } finally {
      this.isLoading = false;
    }
  }

  showError(message: string): void {
    this.errorMessage = message;
    
    // Animación de error
    anime({
      targets: this.loginForm.nativeElement,
      translateX: [-10, 10, -10, 10, 0],
      duration: 400,
      easing: 'easeInOutCubic'
    });
  }

  fillDemoCredentials(role: 'admin' | 'contador'): void {
    if (role === 'admin') {
      this.username = 'admin';
      this.password = 'admin123';
    } else {
      this.username = 'contador1';
      this.password = 'contador123';
    }

    // Animación de relleno
    anime({
      targets: '.form-input',
      scale: [1, 1.02, 1],
      duration: 300,
      delay: anime.stagger(100),
      easing: 'easeInOutCubic'
    });
  }
}
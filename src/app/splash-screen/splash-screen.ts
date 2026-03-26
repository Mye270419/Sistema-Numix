import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

declare var anime: any;

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.html',
  styleUrls: ['./splash-screen.css']
})
export class SplashScreenComponent implements OnInit, AfterViewInit {
  @ViewChild('splashContainer')     splashContainer!:     ElementRef;
  @ViewChild('particlesContainer')  particlesContainer!:  ElementRef;
  @ViewChild('numixContainer')      numixContainer!:      ElementRef;
  @ViewChild('dashboardTransition') dashboardTransition!: ElementRef;

  showStartButton = false;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.startAnimation(), 500);
  }

  // ── Partículas de fondo (ambientales) ─────────────────
  createParticles(): void {
    const container = this.particlesContainer.nativeElement;

    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top  = Math.random() * 100 + '%';
      container.appendChild(p);
    }

    anime({
      targets:    '.particle',
      opacity:    [0, 0.4, 0],
      translateY: [() => anime.random(-40, 40),  () => anime.random(-80, 80)],
      translateX: [() => anime.random(-30, 30),  () => anime.random(-60, 60)],
      scale:      [0.5, 1, 0.5],
      duration:   () => anime.random(4000, 8000),
      delay:      () => anime.random(0, 3000),
      loop:       true,
      easing:     'easeInOutSine'
    });
  }

  // ── Partículas que explotan junto a cada letra ─────────
  explodirEnLetra(letraEl: HTMLElement): void {
    const container  = this.numixContainer.nativeElement;
    const rect       = letraEl.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    const cx = rect.left - parentRect.left + rect.width  / 2;
    const cy = rect.top  - parentRect.top  + rect.height / 2;

    for (let i = 0; i < 10; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position: absolute;
        left: ${cx}px;
        top:  ${cy}px;
        width: 4px; height: 4px;
        border-radius: 50%;
        background: rgba(180, 200, 255, 0.9);
        pointer-events: none;
        z-index: 20;
      `;
      container.appendChild(p);

      anime({
        targets:    p,
        translateX: anime.random(-80, 80),
        translateY: anime.random(-70, 70),
        opacity:    [1, 0],
        scale:      [1, 0],
        duration:   900,
        easing:     'easeOutCubic',
        complete:   () => p.remove()
      });
    }
  }

  // ── Animación principal ────────────────────────────────
  startAnimation(): void {
    this.createParticles();

    // Subtítulo aparece suavemente
    anime({
      targets:    '.splash-subtitle',
      opacity:    [0, 1],
      translateY: [10, 0],
      duration:   800,
      delay:      400,
      easing:     'easeOutCubic'
    });

    // Letras entran UNA POR UNA — más lentas
    const letters = document.querySelectorAll('.numix-letter');

    letters.forEach((letra, index) => {
      const letraEl = letra as HTMLElement;
      const delay   = 300 + index * 220;

      anime({
        targets:    letraEl,
        opacity:    [0, 1],
        scale:      [0.5, 1],
        translateY: [40, 0],
        duration:   800,
        delay:      delay,
        easing:     'easeOutBack',
        complete:   () => {
          // Partículas explotan JUSTO cuando la letra termina de aparecer
          this.explodirEnLetra(letraEl);

          anime({
            targets:  letraEl,
            opacity:  [1, 0.7, 1],
            duration: 600,
            easing:   'easeInOutSine'
          });
        }
      });
    });

    // Tiempo total: 300 + (4 letras * 220ms) + 800ms animacion = ~1980ms
    const tiempoEntrada = 300 + (letters.length - 1) * 220 + 800;

    // Brillo final sobre todas las letras juntas
    setTimeout(() => {
      anime({
        targets:  '.numix-letter',
        scale:    [1, 1.04, 1],
        duration: 600,
        delay:    anime.stagger(60),
        easing:   'easeInOutSine'
      });
    }, tiempoEntrada);

    // Pulsos de energía
    setTimeout(() => {
      anime({
        targets:  '.energy-pulse',
        opacity:  [0, 0.5, 0],
        scale:    [0.5, 3],
        duration: 1200,
        delay:    anime.stagger(150),
        easing:   'easeOutCubic'
      });
    }, tiempoEntrada + 200);

    // Transición al login
    setTimeout(() => this.transitionToLogin(), tiempoEntrada + 1800);
  }

  // ── Transición al login ────────────────────────────────
  transitionToLogin(): void {
    anime({
      targets:  this.splashContainer.nativeElement,
      opacity:  [1, 0],
      scale:    [1, 1.03],
      duration: 800,
      easing:   'easeInCubic',
      complete: () => this.router.navigate(['/login'])
    });

    anime({
      targets:  this.dashboardTransition.nativeElement,
      opacity:  [0, 1],
      duration: 600,
      easing:   'easeOutCubic'
    });
  }
}
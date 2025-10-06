import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Solución definitiva para anime.js
declare var anime: any;

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],  // ✅ Agregar esto
  templateUrl: './splash-screen.html',
  styleUrls: ['./splash-screen.css']
})




export class SplashScreenComponent implements OnInit, AfterViewInit {
  @ViewChild('splashContainer') splashContainer!: ElementRef;
  @ViewChild('particlesContainer') particlesContainer!: ElementRef;
  @ViewChild('numixContainer') numixContainer!: ElementRef;
  @ViewChild('dashboardTransition') dashboardTransition!: ElementRef;

  showStartButton = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('🔥 NUMIX Splash Screen iniciado');
  }

  ngAfterViewInit(): void {
    // Auto-iniciar después de 2 segundos
    setTimeout(() => {
      this.startAnimation();
    }, 2000);
  }

  createParticles(): void {
    const container = this.particlesContainer.nativeElement;
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      container.appendChild(particle);
    }
    
    anime({
      targets: '.particle',
      opacity: [0, 0.6, 0],
      translateY: [
        () => anime.random(-50, 50),
        () => anime.random(-100, 100)
      ],
      translateX: [
        () => anime.random(-30, 30),
        () => anime.random(-60, 60)
      ],
      scale: [0.5, 1, 0.5],
      duration: () => anime.random(3000, 6000),
      delay: () => anime.random(0, 3000),
      loop: true,
      easing: 'easeInOutSine'
    });
  }

  positionElements(): void {
    const letters = this.numixContainer.nativeElement.querySelectorAll('.numix-letter');
    const pulses = this.numixContainer.nativeElement.querySelectorAll('.energy-pulse');
    
    letters.forEach((letter: HTMLElement, index: number) => {
      if (pulses[index]) {
        const rect = letter.getBoundingClientRect();
        const containerRect = letter.parentElement!.getBoundingClientRect();
        
        pulses[index].style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
        pulses[index].style.top = (rect.top - containerRect.top + rect.height / 2) + 'px';
      }
    });
  }

  startAnimation(): void {
    console.log('🎆 ¡Iniciando animación épica!');
    
    this.showStartButton = false;
    this.createParticles();
    
    setTimeout(() => {
      this.positionElements();
    }, 100);

    // Fase 1: Aparición dramática
    anime({
      targets: '.numix-letter',
      opacity: [0, 0.15],
      scale: [0, 1.8],
      duration: 800,
      delay: anime.stagger(200),
      easing: 'easeOutCubic'
    }).finished.then(() => {
      
      // Fase 2: Iluminación secuencial
      const letters = this.numixContainer.nativeElement.querySelectorAll('.numix-letter');
      
      letters.forEach((letter: HTMLElement, index: number) => {
        setTimeout(() => {
          console.log(`💡 Iluminando: ${letter.textContent}`);
          
          // Iluminar letra
          anime({
            targets: letter,
            color: ['#1a1a1a', '#ffffff'],
            textShadow: [
              '0 0 0px rgba(255,255,255,0)',
              '0 0 40px rgba(255,255,255,0.9), 0 0 80px rgba(255,255,255,0.5)'
            ],
            duration: 500,
            easing: 'easeOutQuart'
          });
          
          // Pulso de energía
          const pulse = this.numixContainer.nativeElement.querySelector(`[data-pulse="${index}"]`);
          if (pulse) {
            anime({
              targets: pulse,
              opacity: [0, 0.8, 0],
              scale: [0.5, 3, 4],
              duration: 1000,
              easing: 'easeOutCubic'
            });
          }
          
          // Efectos especiales para la X
          if (index === 4) {
            console.log('🎇 ¡EFECTOS ESPECIALES PARA LA X!');
            setTimeout(() => {
              // Explosión de partículas
              for (let i = 0; i < 20; i++) {
                const specialParticle = document.createElement('div');
                specialParticle.className = 'particle';
                specialParticle.style.position = 'absolute';
                specialParticle.style.left = '50%';
                specialParticle.style.top = '50%';
                specialParticle.style.width = '4px';
                specialParticle.style.height = '4px';
                specialParticle.style.background = 'rgba(255,255,255,0.9)';
                this.numixContainer.nativeElement.appendChild(specialParticle);
                
                anime({
                  targets: specialParticle,
                  translateX: anime.random(-200, 200),
                  translateY: anime.random(-200, 200),
                  opacity: [1, 0],
                  scale: [1, 0],
                  duration: 1500,
                  easing: 'easeOutCubic',
                  complete: () => specialParticle.remove()
                });
              }
              
              // Brillo final
              setTimeout(() => {
                anime({
                  targets: '.numix-letter',
                  textShadow: [
                    '0 0 40px rgba(255,255,255,0.9), 0 0 80px rgba(255,255,255,0.5)',
                    '0 0 60px rgba(255,255,255,1), 0 0 120px rgba(255,255,255,0.8), 0 0 200px rgba(255,255,255,0.4)'
                  ],
                  duration: 800,
                  direction: 'alternate',
                  easing: 'easeInOutSine'
                }).finished.then(() => {
                  
                  // Asentamiento elegante
                  anime({
                    targets: '.numix-letter',
                    scale: [1.8, 1],
                    textShadow: [
                      '0 0 60px rgba(255,255,255,1), 0 0 120px rgba(255,255,255,0.8)',
                      '0 0 20px rgba(255,255,255,0.6)'
                    ],
                    duration: 1000,
                    easing: 'easeOutCubic'
                  }).finished.then(() => {
                    
                    // Transición al dashboard
                    setTimeout(() => {
                      this.transitionToDashboard();
                    }, 1500);
                  });
                });
              }, 300);
            }, 400);
          }
        }, index < 4 ? index * 150 : (index * 150) + 300); // Timing especial para X
      });
    });
  }

  transitionToDashboard(): void {
    console.log('🚀 Transicionando al dashboard...');
    
    anime({
      targets: this.splashContainer.nativeElement,
      opacity: [1, 0],
      duration: 1000,
      easing: 'easeInCubic',
      complete: () => {
        // Aquí irá la navegación al dashboard
       this.router.navigate(['/login']);
      }
    });
    
    anime({
      targets: this.dashboardTransition.nativeElement,
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutCubic'
    });
  }
}
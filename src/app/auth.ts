// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'administrador' | 'contador' | 'gerente' | 'facturador';
  fullName: string;
  empresa: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Usuarios predefinidos para demo
  private users: User[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@numix.bo',
      role: 'administrador',
      fullName: 'Administrador NUMIX',
      empresa: 'NUMIX Contabilidad'
    },
    {
      id: 2,
      username: 'contador1',
      email: 'contador@numix.bo',
      role: 'contador',
      fullName: 'Juan Pérez',
      empresa: 'NUMIX Contabilidad'
    }
  ];

  // Credenciales predefinidas (en producción esto va a una API) - ver como lo hago para que este sea seguro
  private credentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'contador1', password: 'contador123' }
  ];

  login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Simular delay de API
      setTimeout(() => {
        const credential = this.credentials.find(
          c => c.username === username && c.password === password
        );

        if (credential) {
          const user = this.users.find(u => u.username === username);
          if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
            console.log('🎉 Login exitoso:', user);
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      }, 1000); // Simular tiempo de respuesta del servidor
    });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    console.log('👋 Usuario desconectado');
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  get isAdmin(): boolean {
    return this.currentUserValue?.role === 'administrador';
  }
}